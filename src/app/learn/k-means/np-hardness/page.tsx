import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "NP-hardness of optimal clustering — Manifold",
  description:
    "Finding the globally optimal k-means clustering is NP-hard. That single fact explains why we run a greedy heuristic with restarts instead of solving it exactly — and why we can never be sure we found the best.",
};

export default function NPHardnessPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>Go deeper</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        NP-hardness of optimal clustering
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Lloyd&rsquo;s algorithm finds <em>a</em> good clustering, never guaranteed the best. That isn&rsquo;t
        laziness — finding the truly optimal one is computationally intractable, and knowing why reframes
        everything we&rsquo;ve done.
      </p>

      <div className="lesson">
        <h2>The problem we&rsquo;re really solving</h2>
        <p>
          The k-means objective is clean: among <em>all</em> ways to partition <em>n</em> points into{" "}
          <em>k</em> groups, find the one with the lowest inertia.
        </p>
        <MathBlock>{String.raw`\min_{C_1,\dots,C_k} \; \sum_{j=1}^{k}\sum_{\mathbf{x}\in C_j} \lVert \mathbf{x}-\boldsymbol{\mu}_j\rVert^2`}</MathBlock>
        <p>
          It sounds like something you could just solve. You can&rsquo;t — not at scale.
        </p>

        <h2>Why brute force is hopeless</h2>
        <p>
          The number of ways to split <em>n</em> points into <em>k</em> non-empty groups is a Stirling
          number of the second kind — it grows roughly like <M>{String.raw`k^n / k!`}</M>. For a tiny
          dataset of 100 points into 3 clusters that&rsquo;s already astronomically more partitions than there
          are atoms in the universe. You cannot enumerate them.
        </p>

        <h2>It&rsquo;s NP-hard — formally</h2>
        <p>
          Worse than &ldquo;many partitions,&rdquo; the problem is provably <strong>NP-hard</strong>. Two classic
          results pin it down:
        </p>
        <ul style={ul}>
          <li>NP-hard in general for <M>{String.raw`k = 2`}</M> clusters (Aloise et al., 2009; Dasgupta).</li>
          <li>NP-hard even in the plane (<M>{String.raw`d = 2`}</M> dimensions) when <em>k</em> is part of the input (Mahajan et al.).</li>
        </ul>
        <p>
          So unless P = NP, there is <strong>no</strong> algorithm that finds the globally optimal k-means
          clustering in polynomial time in general. The simplicity of the objective hides genuine
          hardness.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            This justifies the whole toolkit
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Because optimal is out of reach, everything we built is the principled response: <strong>Lloyd&rsquo;s
            algorithm</strong> is a fast greedy heuristic that finds a local minimum; <strong>k-means++</strong>
            {" "}seeds it well enough to come with a provable <M>{String.raw`O(\log k)`}</M>-expected bound;{" "}
            <strong>random restarts</strong> hedge against bad basins. We trade the guarantee of optimality
            for tractability — and accept that we can never be certain we&rsquo;ve found the global best.
          </p>
        </div>

        <h2>The nuance: easy in practice, hard in theory</h2>
        <p>
          Two facts soften the picture. First, when clusters are <em>well separated</em>, the problem
          becomes effectively easy and Lloyd&rsquo;s reliably finds the optimum — hardness lives in the
          adversarial and ambiguous cases. Second, there are polynomial-time <strong>approximation
          algorithms</strong> with constant-factor guarantees (and k-means++ gives its log-factor bound for
          free). NP-hardness is about the <em>exact global</em> optimum in the worst case, not about getting
          a good clustering on real data.
        </p>

        <h2>Verify the search space explodes</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/k-means-as-em" style={navLink}>← k-means as EM (link to GMM)</Link>
          <Link href="/learn/k-means/coordinate-descent" style={{ ...navLink, fontWeight: 600 }}>Next up · Convergence as coordinate descent →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `from math import comb, factorial

# Stirling number of the second kind S(n, k): ways to partition n points into k groups
def stirling2(n, k):
    return sum((-1)**i * comb(k, i) * (k - i)**n for i in range(k + 1)) // factorial(k)

for n in [10, 25, 50, 100]:
    print(f"n={n:>3}, k=3:  {stirling2(n, 3):.3e} partitions")
# the count dwarfs the number of atoms in the universe well before n = 100`;

const codeLib = `# There is no library call for the GLOBAL optimum — it's NP-hard.
# In practice you approximate it with good seeding + many restarts:
from sklearn.cluster import KMeans

# n_init independent runs from k-means++ seeds; sklearn returns the best inertia found
km = KMeans(n_clusters=3, init="k-means++", n_init=20, random_state=0).fit(X)
print(km.inertia_)   # the best LOCAL minimum found — not provably global`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
