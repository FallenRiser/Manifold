import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Hard assignment & Voronoi cells — Manifold",
  description:
    "k-Means gives every point to exactly one cluster. That hard rule carves the plane into Voronoi cells — straight-edged regions whose borders are the perpendicular bisectors between centroids.",
};

// three centroids; tile a coarse grid coloured by nearest centroid (Voronoi)
const C = [
  { x: 28, y: 34 },
  { x: 72, y: 30 },
  { x: 50, y: 74 },
];
const COLORS = ["var(--c-regression)", "var(--c-classification)", "var(--c-trees)"];
const W = 320, H = 240;
const sx = (x: number) => 20 + (x / 100) * (W - 40);
const sy = (y: number) => H - 20 - (y / 100) * (H - 40);

// nearest-centroid label for a grid of small squares (pure rational math → SSR-safe)
const STEP = 4;
const CELLS: { gx: number; gy: number; j: number }[] = [];
for (let gx = 0; gx <= 100; gx += STEP) {
  for (let gy = 0; gy <= 100; gy += STEP) {
    let best = 0, bd = Infinity;
    C.forEach((c, j) => {
      const d = (gx - c.x) ** 2 + (gy - c.y) ** 2;
      if (d < bd) { bd = d; best = j; }
    });
    CELLS.push({ gx, gy, j: best });
  }
}

export default function VoronoiPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }]}
        time="about 5 minutes"
        title={<>Hard assignment & Voronoi cells</>}
        intro={<>
          k-Means makes a clean, all-or-nothing choice for every point. That single rule has a
        beautiful geometric shadow: it tiles the whole space into straight-edged regions.
        </>}
      />

      <div className="lesson">
        <h2>One point, one cluster</h2>
        <p>
          The assignment step is <strong>hard</strong>: each point goes wholly to its nearest
          centroid — no fractions, no &ldquo;60% cluster A, 40% cluster B.&rdquo; A point sitting
          right on the fence still gets shoved entirely to one side. This is the opposite of{" "}
          <em>soft</em> assignment, where a point can hold partial membership in several clusters
          (the idea behind fuzzy c-means and Gaussian mixtures, both later chapters).
        </p>

        <h2>The hidden geometry: Voronoi cells</h2>
        <p>
          Ask the same question at <em>every</em> location, not just where the data sits — &ldquo;which
          centroid is nearest here?&rdquo; — and you partition the entire plane. Each centroid owns the
          region of points closer to it than to any other. Those regions are <strong>Voronoi
          cells</strong>.
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {CELLS.map((c, i) => (
              <rect
                key={i}
                x={sx(c.gx) - (STEP / 100) * (W - 40) / 2}
                y={sy(c.gy) - (STEP / 100) * (H - 40) / 2}
                width={(STEP / 100) * (W - 40)}
                height={(STEP / 100) * (H - 40)}
                fill={COLORS[c.j]}
                fillOpacity={0.13}
              />
            ))}
            {C.map((c, j) => (
              <g key={"c" + j}>
                <circle cx={sx(c.x)} cy={sy(c.y)} r={7} fill={COLORS[j]} fillOpacity={0.3} />
                <path d={`M ${sx(c.x) - 5} ${sy(c.y)} L ${sx(c.x) + 5} ${sy(c.y)} M ${sx(c.x)} ${sy(c.y) - 5} L ${sx(c.x)} ${sy(c.y) + 5}`} stroke={COLORS[j]} strokeWidth={2.4} strokeLinecap="round" />
              </g>
            ))}
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Every point in a tinted region is closer to that region&rsquo;s ✛ than to any other. The
            borders are dead straight — and where three regions meet sits a point equidistant from
            three centroids.
          </div>
        </div>

        <h2>Why the borders are straight lines</h2>
        <p>
          The boundary between two centroids is the set of points <em>equidistant</em> from both —
          and the locus of points equally far from two fixed points is exactly the{" "}
          <strong>perpendicular bisector</strong> of the segment joining them: a straight line.
          With squared Euclidean distance the cells are always convex polygons. This is also why
          k-means <strong>cannot</strong> carve out a curved or ring-shaped cluster — its only
          available borders are flat. (That limitation gets its own &ldquo;when k-means fails&rdquo;
          chapter.)
        </p>

        <h2>Assignment is just nearest-centroid lookup</h2>
        <p>
          Classifying a brand-new point is the same operation: find the nearest centroid, done. No
          retraining — which is why k-means doubles as a fast vector quantizer.
        </p>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-clustering)"
          questions={[
            {
              q: "k-means' objective — inertia — is the sum of…",
              options: ["Squared distances from each point to its own cluster's centroid", "Distances between all pairs of centroids", "Squared distances from every point to the global mean"],
              answer: 0,
              explain: "Each point is charged only against its assigned centroid, squared. Both halves of Lloyd's algorithm are just moves that lower this one number.",
            },
            {
              q: "“Hard assignment” means…",
              options: ["Every point belongs 100% to exactly one cluster — no fractions, no in-between", "Some points are hard to assign", "Assignments are fixed after initialization"],
              answer: 0,
              explain: "k-means never hedges — a point one inch from the boundary counts fully for its side. Fuzzy c-means and Gaussian mixtures relax exactly this, later in the track.",
            },
            {
              q: "With centroids fixed, the regions assigned to each centroid have boundaries that are…",
              options: ["Straight lines — the perpendicular bisectors between centroid pairs", "Circles centred on each centroid", "Curves of constant inertia"],
              answer: 0,
              explain: "That's the Voronoi picture: k-means can only ever draw convex, straight-edged cells — the geometric root of every failure mode on curved or nested clusters.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-means/the-objective-inertia", label: <>← The objective: inertia</> }} next={{ href: "/learn/k-means/assign-and-update", label: <>Next up · Assign &amp; update →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# three learned centroids
centroids = np.array([[0.0, 0.0], [4.0, 4.0], [8.0, 0.0]])

def predict(points, C):
    # squared distance to every centroid, then take the argmin (hard choice)
    d = ((points[:, None, :] - C[None, :, :])**2).sum(axis=2)
    return d.argmin(axis=1)

new = np.array([[3.5, 3.0], [7.0, 0.5], [0.2, -0.3]])
print(predict(new, centroids))   # one integer label per point`;

const codeLib = `import numpy as np
from sklearn.cluster import KMeans

rng = np.random.default_rng(7)
X = np.vstack([rng.normal(c, 0.6, (40, 2)) for c in [(0, 0), (4, 4), (8, 0)]])
km = KMeans(n_clusters=3, n_init=10, random_state=0).fit(X)

# .predict() is a pure nearest-centroid lookup — no refitting
new = np.array([[3.5, 3.0], [7.0, 0.5], [0.2, -0.3]])
print(km.predict(new))`;



