import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Random restarts — Manifold",
  description:
    "The simplest defence against bad initialization: run k-means many times from different seeds and keep the lowest-inertia result. That's exactly what n_init does.",
};

export default function RandomRestartsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }]}
        time="about 4 minutes"
        title={<>Random restarts</>}
        intro={<>
          If one run can fall into a bad local minimum, run it several times and keep the best. It&rsquo;s
        almost embarrassingly simple — and it works, because inertia gives you an honest scorecard.
        </>}
      />

      <div className="lesson">
        <h2>The recipe</h2>
        <ul style={ul}>
          <li>Run the full assign/update loop to convergence from a fresh random seed.</li>
          <li>Record the final inertia.</li>
          <li>Repeat <M>{String.raw`m`}</M> times.</li>
          <li>Keep the clustering with the <strong>lowest</strong> inertia.</li>
        </ul>
        <p>
          The key enabler: inertia is a single number you can compare across runs. Unlike supervised
          learning, you don&rsquo;t need a held-out set to know which restart was best — the objective itself
          ranks them. Each restart is independent, so they parallelise perfectly.
        </p>

        <h2>Why it helps</h2>
        <p>
          A bad outcome needs an unlucky seed. If any single run has a decent probability of landing in
          a good basin, the chance that <em>all</em> <M>{String.raw`m`}</M> runs miss it shrinks fast with{" "}
          <M>{String.raw`m`}</M>. You&rsquo;re not making one run smarter — you&rsquo;re buying more lottery tickets and
          keeping the winner.
        </p>

        <Callout color="var(--c-clustering)" title={<>This is what n_init is</>}>
          scikit-learn&rsquo;s <code>n_init</code> parameter <em>is</em> the number of random restarts; it
            silently returns the best of them. The cost is linear — <code>n_init=10</code> means ten
            times the work — which is the whole motivation for the next page: a smarter seed that needs
            far fewer restarts.
        </Callout>

        <h2>Restarts vs. better seeding</h2>
        <p>
          Random restarts attack the problem with brute force; k-means++ attacks it with a better
          starting point. They&rsquo;re complementary — and in practice you use both: a handful of
          k-means++ restarts beats many purely-random ones. That&rsquo;s why modern defaults pair{" "}
          <code>init="k-means++"</code> with a small <code>n_init</code>.
        </p>

        <h2>Best-of-m, by hand and by library</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/the-initialization-problem", label: <>← The initialization problem</> }} next={{ href: "/learn/k-means/k-means-plus-plus", label: <>Next up · k-means++ →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def lloyd(X, init, iters=50):
    C = init.copy()
    for _ in range(iters):
        lab = ((X[:, None, :] - C[None, :, :])**2).sum(2).argmin(1)
        C = np.array([X[lab == j].mean(0) if (lab == j).any() else C[j]
                      for j in range(len(C))])
    inertia = sum(((X[lab == j] - C[j])**2).sum() for j in range(len(C)))
    return inertia, C

def kmeans_best_of(X, k, m=10, seed=0):
    best = None
    for s in range(m):
        r = np.random.default_rng(seed + s)
        J, C = lloyd(X, X[r.choice(len(X), k, replace=False)])
        if best is None or J < best[0]:
            best = (J, C)
    return best   # lowest-inertia run across m restarts`;

const codeLib = `from sklearn.cluster import KMeans

# n_init IS the number of random restarts; sklearn returns the best automatically.
km = KMeans(n_clusters=3, init="random", n_init=10, random_state=0).fit(X)
print(km.inertia_)   # already the minimum over the 10 restarts`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


