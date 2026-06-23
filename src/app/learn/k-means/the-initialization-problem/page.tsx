import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The initialization problem — Manifold",
  description:
    "k-Means finds a local minimum, and which one depends entirely on where the centroids start. Bad seeding can give you a clustering that's visibly, badly wrong.",
};

// two contrasting outcomes from the same data, different seeds.
// left: good (one centroid per blob). right: bad (two share a blob, one straddles two).
const BLOBS = [
  { cx: 26, cy: 30 }, { cx: 74, cy: 32 }, { cx: 50, cy: 76 },
];
const GOOD = [{ x: 26, y: 30 }, { x: 74, y: 32 }, { x: 50, y: 76 }];
const BAD = [{ x: 22, y: 28 }, { x: 30, y: 34 }, { x: 62, y: 54 }];
const W = 150, H = 150;
const sx = (x: number) => Math.round((12 + (x / 100) * (W - 24)) * 100) / 100;
const sy = (y: number) => Math.round((H - 12 - (y / 100) * (H - 24)) * 100) / 100;

function Panel({ title, centroids, tone }: { title: string; centroids: { x: number; y: number }[]; tone: string }) {
  return (
    <div style={{ flex: 1, minWidth: 150 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {BLOBS.map((b, i) =>
          [...Array(7)].map((_, j) => {
            const a = (j / 7) * Math.PI * 2;
            const px = b.cx + Math.cos(a) * 9 + (j % 2 ? 3 : -3);
            const py = b.cy + Math.sin(a) * 9 + (j % 3 ? 2 : -2);
            return <circle key={i + "-" + j} cx={sx(px)} cy={sy(py)} r={2.6} fill="var(--c-clustering)" fillOpacity={0.5} />;
          })
        )}
        {centroids.map((c, j) => (
          <path key={j} d={`M ${sx(c.x) - 5} ${sy(c.y)} L ${sx(c.x) + 5} ${sy(c.y)} M ${sx(c.x)} ${sy(c.y) - 5} L ${sx(c.x)} ${sy(c.y) + 5}`} stroke={tone} strokeWidth={2.6} strokeLinecap="round" />
        ))}
      </svg>
      <div style={{ fontSize: 12, color: tone, marginTop: 6, fontWeight: 500 }}>{title}</div>
    </div>
  );
}

export default function InitProblemPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The initialization problem
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        We proved k-means always converges — but only to a <em>local</em> minimum. The single biggest
        lever on which one you land in isn&rsquo;t the data or the algorithm. It&rsquo;s where the centroids
        start.
      </p>

      <div className="lesson">
        <h2>Same data, same algorithm, different answer</h2>
        <p>
          Run k-means twice on identical points with different starting centroids and you can get
          two genuinely different clusterings. Both are stable fixed points — neither step can improve
          either — but one can have far higher inertia than the other. The algorithm has no way to
          climb out of a bad basin; descent is all it does.
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <div style={{ display: "flex", gap: 14 }}>
            <Panel title="Good seed → one centroid per blob" centroids={GOOD} tone="var(--good)" />
            <Panel title="Bad seed → two centroids trapped, one blob orphaned" centroids={BAD} tone="var(--bad, #d9534f)" />
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Three obvious blobs. On the left the centroids found them. On the right two centroids got
            stuck splitting one blob while a whole cluster sits unclaimed — a local minimum k-means
            will never escape on its own.
          </div>
        </div>

        <h2>Why &ldquo;just pick random points&rdquo; goes wrong</h2>
        <p>
          The oldest scheme — <strong>Forgy</strong> — picks <em>k</em> random data points as the
          starting centroids. Its weakness: by chance, two seeds can land in the same dense blob,
          leaving a different real cluster with no nearby centroid. Once that happens, the assign/update
          loop tends to cement it rather than fix it. The denser and more numerous your true clusters,
          the likelier a bad random draw becomes.
        </p>

        <h2>Two cures, two chapters</h2>
        <ul style={ul}>
          <li>
            <strong>Try many seeds, keep the best</strong> — random restarts. Cheap, embarrassingly
            parallel, and the baseline every library ships.
          </li>
          <li>
            <strong>Seed smarter from the start</strong> — k-means++ spreads the initial centroids out
            on purpose, making a good basin likely on the very first try.
          </li>
        </ul>
        <p>Both are next. First, see the symptom directly:</p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/mini-batch" style={navLink}>← Mini-batch k-means</Link>
          <Link href="/learn/k-means/random-restarts" style={{ ...navLink, fontWeight: 600 }}>Next up · Random restarts →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
X = np.vstack([rng.normal(c, 0.5, (60, 2)) for c in [(0, 0), (5, 0), (2.5, 4)]])

def lloyd(X, init, iters=50):
    C = init.copy()
    for _ in range(iters):
        d = ((X[:, None, :] - C[None, :, :])**2).sum(axis=2)
        lab = d.argmin(axis=1)
        C = np.array([X[lab == j].mean(axis=0) if (lab == j).any() else C[j]
                      for j in range(len(C))])
    inertia = sum(((X[lab == j] - C[j])**2).sum() for j in range(len(C)))
    return inertia

# different random seeds -> different local minima, sometimes much worse
for s in range(6):
    r = np.random.default_rng(s)
    init = X[r.choice(len(X), 3, replace=False)]
    print(f"seed {s}: inertia {lloyd(X, init):.1f}")`;

const codeLib = `import numpy as np
from sklearn.cluster import KMeans

rng = np.random.default_rng(0)
X = np.vstack([rng.normal(c, 0.5, (60, 2)) for c in [(0, 0), (5, 0), (2.5, 4)]])

# init='random' + n_init=1 reproduces the lottery: run it a few times, watch inertia vary
for s in range(6):
    km = KMeans(n_clusters=3, init="random", n_init=1, random_state=s).fit(X)
    print(f"seed {s}: inertia {km.inertia_:.1f}")`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
