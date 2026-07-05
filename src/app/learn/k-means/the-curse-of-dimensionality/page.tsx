import { Quiz } from "@/components/Quiz";
import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The curse of dimensionality — Manifold",
  description:
    "In high dimensions, distances stop being informative: everything becomes roughly equidistant. Since k-means runs entirely on distances, this quietly undermines it — and explains why we reduce dimensions first.",
};

// distance concentration: nearest vs farthest distance as d grows (illustrative)
const DIMS = [1, 2, 5, 10, 50, 100, 500];
// (max-min)/min ratio shrinks toward 0 as d grows — contrast collapses
const CONTRAST = [3.8, 2.4, 1.1, 0.62, 0.21, 0.14, 0.06];
const W = 320, H = 160, padL = 32, padB = 26, padT = 12;
const gx = (i: number) => Math.round((padL + (i / (DIMS.length - 1)) * (W - padL - 12)) * 100) / 100;
const gy = (v: number) => Math.round((padT + (1 - v / 4) * (H - padT - padB)) * 100) / 100;

export default function CursePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }]}
        time="about 6 minutes"
        title={<>The curse of dimensionality</>}
        intro={<>
          k-Means is built entirely on distances. In high dimensions, distances quietly lose their meaning —
        so before we even reach the algorithm, it&rsquo;s worth knowing the trap that lurks in wide data.
        </>}
      />

      <div className="lesson">
        <h2>Distances concentrate</h2>
        <p>
          The core phenomenon: as the number of dimensions <M>{String.raw`d`}</M> grows, the distance to the{" "}
          <em>nearest</em> point and the distance to the <em>farthest</em> point grow closer and closer
          together. In high enough dimensions, <strong>everything is roughly equidistant from everything
          else</strong>. The very contrast that &ldquo;nearest centroid&rdquo; relies on evaporates:
        </p>
        <MathBlock>{String.raw`\lim_{d \to \infty} \frac{\text{dist}_{\max} - \text{dist}_{\min}}{\text{dist}_{\min}} \to 0`}</MathBlock>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <polyline points={DIMS.map((_, i) => `${gx(i)},${gy(CONTRAST[i])}`).join(" ")} fill="none" stroke="var(--c-clustering)" strokeWidth={2.4} />
            {DIMS.map((d, i) => (
              <g key={d}>
                <circle cx={gx(i)} cy={gy(CONTRAST[i])} r={3} fill="var(--c-clustering)" />
                <text x={gx(i)} y={H - 5} fontSize={9} fill="var(--faint)" textAnchor="middle">{d}</text>
              </g>
            ))}
            <text x={W / 2} y={H - 16} fontSize={9} fill="var(--faint)" textAnchor="middle">dimensions d (log-ish)</text>
            <text x={11} y={H / 2} fontSize={9} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 11 ${H / 2})`}>distance contrast</text>
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            The gap between the nearest and farthest neighbour, relative to the nearest, collapses toward
            zero as dimensions grow. By a few hundred dimensions, &ldquo;near&rdquo; and &ldquo;far&rdquo; are
            nearly the same — distance carries almost no signal.
          </div>
        </div>

        <h2>Why high-dimensional space is so strange</h2>
        <ul style={ul}>
          <li>
            <strong>Volume flees to the edges.</strong> In high dimensions almost all the volume of a region
            sits near its boundary, and points drift toward the &ldquo;corners&rdquo; — uniform data ends up
            spread thin and far apart.
          </li>
          <li>
            <strong>Data becomes sparse.</strong> To keep the same density you need exponentially more points
            as <M>{String.raw`d`}</M> grows. Real datasets are hopelessly sparse in their raw feature space.
          </li>
          <li>
            <strong>Noise accumulates.</strong> Every irrelevant feature still contributes to the distance
            sum, so many useless dimensions can drown out the few that carry the real structure.
          </li>
        </ul>

        <h2>What it means for k-means</h2>
        <p>
          Since assignment is &ldquo;go to the nearest centroid,&rdquo; and nearness becomes meaningless, clusters
          blur, results get unstable, and inertia stops discriminating good groupings from bad. The
          algorithm still runs and still returns <em>k</em> clusters — they&rsquo;re just far less trustworthy.
        </p>

        <Callout color="var(--c-clustering)" title={<>The standard escape</>}>
          Reduce dimensions before clustering — PCA, UMAP, or an autoencoder — so distances become
            meaningful again, and consider Manhattan distance, which concentrates a little less than
            Euclidean. The good news for modern work: real data usually lives on a low-dimensional{" "}
            <em>manifold</em> inside its high-dimensional space, and a good embedding finds it. That&rsquo;s why{" "}
            <Link href="/learn/k-means/clustering-after-dimensionality-reduction" style={inlineLink}>clustering
            after dimensionality reduction</Link> is a whole page later, and why embedding-based clustering
            works so well.
        </Callout>

        <h2>See the contrast collapse</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-clustering)"
          questions={[
            {
              q: "In very high dimensions, distances between random points tend to…",
              options: ["Concentrate — nearest and farthest neighbours become nearly the same distance away", "Spread further apart, making clusters easier to find", "Shrink toward zero"],
              answer: 0,
              explain: "The ratio of farthest to nearest distance approaches 1, so 'nearest centroid' loses its meaning — the contrast that k-means runs on evaporates.",
            },
            {
              q: "The standard practical remedy before clustering high-dimensional data is…",
              options: ["Switching to Manhattan distance", "Reducing dimensionality first (PCA, embeddings), then clustering", "Increasing k to compensate"],
              answer: 1,
              explain: "Fewer, denser dimensions restore distance contrast — which is why 'clustering after dimensionality reduction' has its own page later in this track.",
            },
            {
              q: "Using plain Euclidean distance implicitly assumes the features are…",
              options: ["On comparable scales", "Statistically independent", "Normally distributed"],
              answer: 0,
              explain: "A feature measured in thousands dominates one measured in units — the distance is effectively computed on that one feature alone. Scaling first is non-negotiable for k-means.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-means/distance-metrics-in-depth", label: <>← Distance metrics in depth</> }} next={{ href: "/learn/k-means/the-k-means-idea", label: <>Next up · The k-means idea →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
for d in [1, 2, 10, 100, 1000]:
    X = rng.uniform(size=(1000, d))
    p = X[0]
    dists = np.sqrt(((X[1:] - p)**2).sum(1))
    contrast = (dists.max() - dists.min()) / dists.min()
    print(f"d={d:>4}: contrast (max-min)/min = {contrast:.3f}")
# contrast shrinks toward 0 -> "nearest" and "farthest" become indistinguishable`;

const codeLib = `from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.pipeline import make_pipeline

# fight the curse: reduce dimensions first, THEN cluster
model = make_pipeline(
    StandardScaler(),
    PCA(n_components=0.95),     # keep 95% of variance, drop noise dimensions
    KMeans(n_clusters=8, n_init=10, random_state=0),
)
labels = model.fit_predict(X_highdim)`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };

const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

