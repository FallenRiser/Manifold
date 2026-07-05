import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Fuzzy c-means — Manifold",
  description:
    "Fuzzy c-means replaces k-means' hard one-cluster-per-point rule with graded memberships, so a point can be 70% one cluster and 30% another. Soft assignment, the same alternating loop.",
};

export default function FuzzyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "Variants", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Fuzzy c-means</>}
        intro={<>
          Hard assignment forces every point to pick one cluster, even when it sits squarely between two.
        Fuzzy c-means lets a point belong to several at once, by degrees — the soft-assignment cousin of
        k-means.
        </>}
      />

      <div className="lesson">
        <h2>From a vote to a distribution</h2>
        <p>
          In k-means each point&rsquo;s membership is 0 or 1 — it&rsquo;s in exactly one cluster. Fuzzy c-means
          replaces that with a <strong>membership</strong> <M>{String.raw`u_{ij} \in [0,1]`}</M> for each
          point–cluster pair, with the memberships of any point summing to one:
        </p>
        <MathBlock>{String.raw`\sum_{j=1}^{c} u_{ij} = 1, \qquad u_{ij} \ge 0`}</MathBlock>
        <p>
          A point near a boundary might be <M>{String.raw`(0.55, 0.45)`}</M> across two clusters instead of
          being arbitrarily forced into one. Those memberships are genuinely useful: they flag ambiguous,
          overlapping, or boundary points — information hard assignment throws away.
        </p>

        <h2>The objective and the loop</h2>
        <p>
          It minimises a membership-weighted inertia, where a <strong>fuzziness exponent</strong>{" "}
          <M>{String.raw`m > 1`}</M> controls how soft the assignment is:
        </p>
        <MathBlock>{String.raw`J_m = \sum_{i=1}^{n}\sum_{j=1}^{c} u_{ij}^{\,m}\, \lVert \mathbf{x}_i - \mathbf{c}_j \rVert^2`}</MathBlock>
        <p>
          The algorithm alternates exactly like k-means, but with soft quantities:
        </p>
        <ul style={ul}>
          <li><strong>Update memberships</strong> — each <M>{String.raw`u_{ij}`}</M> from the point&rsquo;s relative distances to all centers.</li>
          <li><strong>Update centers</strong> — each center is the <em>membership-weighted</em> mean of all points (not just its hard members).</li>
        </ul>
        <p>
          As <M>{String.raw`m \to 1`}</M> the memberships sharpen toward 0/1 and fuzzy c-means becomes
          ordinary k-means; larger <M>{String.raw`m`}</M> (a common default is 2) makes assignments softer and
          fuzzier. So k-means is, again, a hard limit of a softer method.
        </p>

        <Callout color="var(--c-clustering)" title={<>Fuzzy c-means vs. GMM</>}>
          Both give soft memberships, but differently. Fuzzy c-means&rsquo; memberships come from a distance
            heuristic with a tunable <M>{String.raw`m`}</M> — no probability model. A Gaussian mixture&rsquo;s soft
            assignments are genuine <em>posterior probabilities</em> from a generative model, and it also
            learns each cluster&rsquo;s shape and weight. If you want principled probabilities and elliptical
            clusters, reach for GMM; fuzzy c-means is the lighter, k-means-flavoured way to get graded
            membership. It still inherits k-means&rsquo; spherical-shape and local-minimum limitations.
        </Callout>

        <h2>Soft memberships in code</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/k-medians-and-k-modes", label: <>← k-medians &amp; k-modes</> }} next={{ href: "/learn/k-means/kernel-and-spherical", label: <>Next up · Kernel &amp; spherical k-means →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def fuzzy_cmeans(X, c, m=2.0, iters=100):
    n = len(X)
    rng = np.random.default_rng(0)
    U = rng.dirichlet(np.ones(c), size=n)         # random memberships, rows sum to 1
    for _ in range(iters):
        # centers = membership-weighted means
        um = U**m
        C = (um.T @ X) / um.sum(0)[:, None]
        # memberships from relative distances
        d = np.linalg.norm(X[:, None, :] - C[None, :, :], axis=2) + 1e-9
        U = 1.0 / (d**(2/(m-1)) * (1.0/d**(2/(m-1))).sum(1, keepdims=True))
    return U, C                                    # U[i] is point i's membership vector`;

const codeLib = `# scikit-fuzzy provides fuzzy c-means out of the box
import skfuzzy as fuzz

# data must be features x samples for skfuzzy
cntr, u, *_ = fuzz.cluster.cmeans(X.T, c=3, m=2.0, error=1e-5,
                                  maxiter=100, seed=0)
hard_labels = u.argmax(axis=0)     # collapse to hard labels if needed
# u[:, i] is the membership distribution of point i`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


