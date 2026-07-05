import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Convergence as coordinate descent — Manifold",
  description:
    "Lloyd's algorithm is block coordinate descent on the k-means objective: fix the assignments and optimise the centroids, fix the centroids and optimise the assignments. That framing proves convergence in one line.",
};

export default function CoordinateDescentPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "Go deeper", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Convergence as coordinate descent</>}
        intro={<>
          We argued informally that k-means converges. Here is the clean reason: Lloyd&rsquo;s algorithm is{" "}
        <strong>block coordinate descent</strong> on the inertia objective — and coordinate descent on a
        bounded-below function that decreases each step must converge.
        </>}
      />

      <div className="lesson">
        <h2>One objective, two sets of variables</h2>
        <p>
          Write inertia as a function of <em>both</em> the assignments <M>{String.raw`r`}</M> (which point
          goes to which cluster) and the centroids <M>{String.raw`\boldsymbol{\mu}`}</M>:
        </p>
        <MathBlock>{String.raw`J(r, \boldsymbol{\mu}) = \sum_{i=1}^{n}\sum_{j=1}^{k} r_{ij}\, \lVert \mathbf{x}_i - \boldsymbol{\mu}_j\rVert^2`}</MathBlock>
        <p>
          where <M>{String.raw`r_{ij} = 1`}</M> if point <M>{String.raw`i`}</M> is in cluster{" "}
          <M>{String.raw`j`}</M>, else 0. There are two blocks of variables — the discrete{" "}
          <M>{String.raw`r`}</M> and the continuous <M>{String.raw`\boldsymbol{\mu}`}</M> — and{" "}
          <M>{String.raw`J`}</M> is hard to minimise over both at once (that&rsquo;s the NP-hard problem). But it&rsquo;s{" "}
          <em>easy</em> over either block with the other held fixed.
        </p>

        <h2>Each step is an exact block minimisation</h2>
        <ul style={ul}>
          <li>
            <strong>Fix <M>{String.raw`\boldsymbol{\mu}`}</M>, minimise over <M>{String.raw`r`}</M>
            (the assign step).</strong> With centroids fixed, each point&rsquo;s term is independent, so you
            minimise <M>{String.raw`J`}</M> by sending every point to its nearest centroid. This is the{" "}
            <em>exact</em> optimum over <M>{String.raw`r`}</M>.
          </li>
          <li>
            <strong>Fix <M>{String.raw`r`}</M>, minimise over <M>{String.raw`\boldsymbol{\mu}`}</M>
            (the update step).</strong> With assignments fixed, <M>{String.raw`J`}</M> is a sum of convex
            quadratics in the centroids; setting the gradient to zero gives the mean of each cluster as the{" "}
            <em>exact</em> optimum over <M>{String.raw`\boldsymbol{\mu}`}</M>.
          </li>
        </ul>
        <p>
          So Lloyd&rsquo;s algorithm alternates exact minimisations over two coordinate blocks. That is the
          textbook definition of <strong>block coordinate descent</strong> (also called alternating
          minimisation).
        </p>

        <h2>The one-line convergence proof</h2>
        <p>
          Now convergence is immediate. Each block step minimises <M>{String.raw`J`}</M> exactly, so neither
          can increase it: <M>{String.raw`J`}</M> is <strong>monotonically non-increasing</strong>. And{" "}
          <M>{String.raw`J \ge 0`}</M> — it&rsquo;s a sum of squares, <strong>bounded below</strong>. A
          non-increasing sequence bounded below converges. Because the assignments come from a{" "}
          <strong>finite</strong> set and <M>{String.raw`J`}</M> strictly drops whenever they change, the
          assignments can&rsquo;t cycle, so the algorithm reaches a fixed point in finitely many steps.
        </p>

        <Callout color="var(--c-clustering)" title={<>What it does and doesn&rsquo;t guarantee</>}>
          Coordinate descent converges to a point where no <em>single block</em> move improves the
            objective — a coordinate-wise (local) minimum. That is exactly k-means&rsquo; situation: it reaches
            a configuration stable under both steps, but not necessarily the global optimum, because joint
            moves over both blocks could still help. The framing thus explains <em>both</em> facts at once —
            why it always stops, and why where it stops depends on initialisation. It also places k-means in
            a huge family (EM, ALS for matrix factorisation, many others) that share this alternating
            structure.
        </Callout>

        <h2>Watch J fall, block by block</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/np-hardness", label: <>← NP-hardness of optimal clustering</> }} next={{ href: "/learn/k-means/bregman-divergences", label: <>Next up · Bregman divergences →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def J(X, r, mu):                       # the joint objective
    return sum(((X[r == j] - mu[j])**2).sum() for j in range(len(mu)))

rng = np.random.default_rng(0)
X = np.vstack([rng.normal(c, 0.6, (40, 2)) for c in [(0,0),(4,4),(8,0)]])
mu = X[rng.choice(len(X), 3, replace=False)]

for step in range(10):
    r = ((X[:, None] - mu[None])**2).sum(2).argmin(1)   # block 1: minimise over r
    print(f"after assign: J = {J(X, r, mu):.1f}")
    mu = np.array([X[r == j].mean(0) for j in range(3)]) # block 2: minimise over mu
    print(f"after update: J = {J(X, r, mu):.1f}")        # J never rises across either step`;

const codeLib = `from sklearn.cluster import KMeans

# verbose=1 prints the objective after each block-coordinate update; it only falls.
KMeans(n_clusters=3, n_init=1, init="random", verbose=1, random_state=0).fit(X)`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


