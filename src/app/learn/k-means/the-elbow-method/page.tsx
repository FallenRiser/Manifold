import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { ElbowLab } from "@/components/labs/ElbowLab";

export const metadata = {
  title: "The elbow method — Manifold",
  description:
    "Plot inertia against k and look for the bend — the point where adding clusters stops paying off. It's the first, simplest answer to 'how many clusters?', with real caveats.",
};

export default function ElbowMethodPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The elbow method
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        k-Means needs you to choose <em>k</em> up front — but the data rarely tells you outright. The
        elbow method is the oldest and most intuitive way to read the answer off a single plot.
      </p>

      <div className="lesson">
        <h2>Why you can&rsquo;t just minimise inertia</h2>
        <p>
          We saw it earlier: inertia <em>always</em> falls as <em>k</em> grows, hitting zero when every
          point is its own cluster. So &ldquo;pick the <em>k</em> with the lowest inertia&rdquo; is useless —
          it always says <em>k</em> = <em>n</em>. The signal isn&rsquo;t the value of inertia; it&rsquo;s the{" "}
          <em>rate</em> at which it drops.
        </p>

        <h2>Look for the bend</h2>
        <p>
          Plot inertia for <em>k</em> = 1, 2, 3, &hellip; The curve falls steeply at first — each new
          centroid carves a genuinely separate group — then flattens once you&rsquo;ve covered the real
          clusters and are only splitting them. The <strong>elbow</strong>, where steep turns into
          shallow, is the sweet spot: enough clusters to capture the structure, not so many that you&rsquo;re
          chasing noise.
        </p>

        <ElbowLab />

        <h2>Making &ldquo;the bend&rdquo; objective</h2>
        <p>
          Eyeballing an elbow is subjective, so it&rsquo;s often automated. A common trick (used in the lab
          above): draw a straight chord from the first point of the curve to the last, then pick the{" "}
          <em>k</em> whose inertia sits farthest from that chord. The Kneedle algorithm formalises the
          same &ldquo;point of maximum curvature&rdquo; idea.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            Where the elbow fails
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            On well-separated blobs the bend is obvious. On real data it&rsquo;s often smeared into a gentle
            curve with <em>no</em> clear corner — overlapping clusters, varying densities, or genuine
            hierarchy all blur it. Treat the elbow as one piece of evidence, not a verdict. The next
            pages — silhouette and the gap statistic — give sturdier, less eyeball-dependent answers.
          </p>
        </div>

        <h2>Compute the curve</h2>
        <p>
          Fit k-means across a range of <em>k</em>, collect each <code>.inertia_</code>, and plot:
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/k-means-plus-plus" style={navLink}>← k-means++</Link>
          <Link href="/learn/k-means/silhouette-analysis" style={{ ...navLink, fontWeight: 600 }}>Next up · Silhouette analysis →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def inertia_for_k(X, k, iters=50, seed=0):
    rng = np.random.default_rng(seed)
    C = X[rng.choice(len(X), k, replace=False)]
    for _ in range(iters):
        lab = ((X[:, None, :] - C[None, :, :])**2).sum(2).argmin(1)
        C = np.array([X[lab == j].mean(0) if (lab == j).any() else C[j] for j in range(k)])
    return sum(((X[lab == j] - C[j])**2).sum() for j in range(k))

ks = range(1, 9)
curve = [inertia_for_k(X, k) for k in ks]
# the elbow: k farthest from the chord joining the first and last points
y = np.array(curve); x = np.arange(1, 9)
num = np.abs((y[-1]-y[0])*x - (x[-1]-x[0])*y + x[-1]*y[0] - y[-1]*x[0])
print("elbow at k =", x[np.argmax(num)])`;

const codeLib = `import matplotlib.pyplot as plt
from sklearn.cluster import KMeans

ks = range(1, 9)
inertias = [KMeans(n_clusters=k, n_init=10, random_state=0).fit(X).inertia_ for k in ks]

plt.plot(list(ks), inertias, "o-")
plt.xlabel("k"); plt.ylabel("inertia"); plt.title("Elbow plot")
plt.show()`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
