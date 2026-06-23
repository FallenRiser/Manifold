import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Why it converges — Manifold",
  description:
    "Both steps of k-means can only lower inertia, and there are finitely many possible assignments — so the algorithm must stop. The catch: it stops at a local minimum.",
};

// illustrative monotone-decreasing inertia trajectory
const TRAJ = [55, 28, 17, 13, 11.5, 11.2, 11.1];
const W = 320, H = 170;
const px = (i: number) => 30 + (i / (TRAJ.length - 1)) * (W - 50);
const py = (v: number) => H - 26 - (v / 60) * (H - 46);

export default function WhyItConvergesPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>Go deeper</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Why it converges
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        k-Means has no learning rate, no stopping tolerance to tune — yet it always halts. Two short
        facts explain why, and one important caveat explains what it halts <em>at</em>.
      </p>

      <div className="lesson">
        <h2>Each step can only lower inertia</h2>
        <p>
          The argument has two halves, one per step:
        </p>
        <ul style={ul}>
          <li>
            <strong>Assign.</strong> Each point switches to its nearest centroid. Its contribution to
            inertia is its squared distance to its centroid — moving to the <em>nearest</em> one can
            only keep that term the same or shrink it. So the assign step never raises <em>J</em>.
          </li>
          <li>
            <strong>Update.</strong> Each centroid moves to the mean of its points. The mean is the
            unique point that minimises total squared distance to a set — so this step also never
            raises <em>J</em>.
          </li>
        </ul>
        <p>
          Two steps, each non-increasing, means <strong>inertia falls (or holds) on every single
          iteration</strong>. It&rsquo;s a staircase that only goes down.
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <polyline points={TRAJ.map((v, i) => `${px(i)},${py(v)}`).join(" ")} fill="none" stroke="var(--c-clustering)" strokeWidth={2.4} />
            {TRAJ.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r={3.5} fill="var(--c-clustering)" />)}
            <text x={W / 2} y={H - 6} fontSize={10} fill="var(--faint)" textAnchor="middle">iteration →</text>
            <text x={12} y={H / 2} fontSize={10} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>inertia</text>
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Inertia is monotonically non-increasing — it never ticks back up. The curve flattens as
            the algorithm nears a fixed point.
          </div>
        </div>

        <h2>And there are only finitely many states</h2>
        <p>
          A run of k-means is fully determined by its <em>assignment</em> — which of the <em>k</em>
          clusters each of the <em>n</em> points belongs to. There are at most <em>k</em><sup>n</sup>
          {" "}such assignments: a big number, but a <strong>finite</strong> one. Since inertia
          strictly drops whenever the assignment changes and can&rsquo;t cycle (it never increases),
          the algorithm can only visit finitely many assignments before one repeats. When an
          iteration changes nothing, you&rsquo;ve hit a fixed point — done.
        </p>

        <h2>The caveat: local, not global</h2>
        <p>
          &ldquo;It stops&rdquo; is not &ldquo;it finds the best clustering.&rdquo; k-Means descends
          to a <strong>local</strong> minimum of inertia that depends entirely on where the centroids
          started. A different initialisation can land in a different, sometimes much worse, basin.
          Finding the <em>global</em> optimum is NP-hard — which is why initialisation
          (k-means++) and multiple restarts get their own chapter.
        </p>

        <h2>See the monotonic drop</h2>
        <p>
          Print the inertia after each iteration and you&rsquo;ll never see it rise:
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/assign-and-update" style={navLink}>← Assign &amp; update</Link>
          <Link href="/learn/k-means/computational-complexity" style={{ ...navLink, fontWeight: 600 }}>Next up · Computational complexity →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

rng = np.random.default_rng(7)
X = np.vstack([rng.normal(c, 0.6, (40, 2)) for c in [(0, 0), (4, 4), (8, 0)]])
k = 3
centroids = X[rng.choice(len(X), k, replace=False)]

def inertia(C):
    d = ((X[:, None, :] - C[None, :, :])**2).sum(axis=2)
    lab = d.argmin(axis=1)
    return sum(((X[lab == j] - C[j])**2).sum() for j in range(k)), lab

for step in range(12):
    J, labels = inertia(centroids)
    print(f"iter {step}:  inertia {J:.1f}")          # never increases
    new = np.array([X[labels == j].mean(axis=0) for j in range(k)])
    if np.allclose(new, centroids):
        break
    centroids = new`;

const codeLib = `import numpy as np
from sklearn.cluster import KMeans

rng = np.random.default_rng(7)
X = np.vstack([rng.normal(c, 0.6, (40, 2)) for c in [(0, 0), (4, 4), (8, 0)]])

# verbose=1 prints the objective each iteration; it decreases monotonically
KMeans(n_clusters=3, n_init=1, init="random", verbose=1, random_state=1).fit(X)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
