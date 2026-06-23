import Link from "next/link";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Random restarts — Manifold",
  description:
    "The simplest defence against bad initialization: run k-means many times from different seeds and keep the lowest-inertia result. That's exactly what n_init does.",
};

export default function RandomRestartsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 4 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Random restarts
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        If one run can fall into a bad local minimum, run it several times and keep the best. It&rsquo;s
        almost embarrassingly simple — and it works, because inertia gives you an honest scorecard.
      </p>

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

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            This is what n_init is
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            scikit-learn&rsquo;s <code>n_init</code> parameter <em>is</em> the number of random restarts; it
            silently returns the best of them. The cost is linear — <code>n_init=10</code> means ten
            times the work — which is the whole motivation for the next page: a smarter seed that needs
            far fewer restarts.
          </p>
        </div>

        <h2>Restarts vs. better seeding</h2>
        <p>
          Random restarts attack the problem with brute force; k-means++ attacks it with a better
          starting point. They&rsquo;re complementary — and in practice you use both: a handful of
          k-means++ restarts beats many purely-random ones. That&rsquo;s why modern defaults pair{" "}
          <code>init="k-means++"</code> with a small <code>n_init</code>.
        </p>

        <h2>Best-of-m, by hand and by library</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/the-initialization-problem" style={navLink}>← The initialization problem</Link>
          <Link href="/learn/k-means/k-means-plus-plus" style={{ ...navLink, fontWeight: 600 }}>Next up · k-means++ →</Link>
        </div>
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

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
