import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Accelerated k-means (Elkan) — Manifold",
  description:
    "Elkan's algorithm uses the triangle inequality to skip most distance computations — same exact result as Lloyd's, often several times faster on low-dimensional data.",
};

export default function ElkanPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "Go deeper", color: "var(--c-metrics)" }]}
        time="about 5 minutes"
        title={<>Accelerated k-means (Elkan)</>}
        intro={<>
          The assign step recomputes every point-to-centroid distance, every iteration. Most of that
        work is wasted — Elkan&rsquo;s algorithm proves which distances can&rsquo;t possibly change the answer
        and skips them. Same clusters, far fewer calculations.
        </>}
      />

      <div className="lesson">
        <h2>The wasted work</h2>
        <p>
          After the first iteration, centroids barely move. A point that was firmly inside cluster 2
          is still in cluster 2 — yet plain Lloyd&rsquo;s recomputes its distance to <em>all</em> <em>k</em>
          {" "}centroids anyway, just to re-confirm what we already suspected. Elkan&rsquo;s insight: use
          cheap bounds to <strong>prove</strong> the nearest centroid hasn&rsquo;t changed, and skip the
          expensive distance entirely.
        </p>

        <h2>The triangle inequality, put to work</h2>
        <p>
          The whole trick rests on one geometric fact: for any three points,
        </p>
        <div style={{ textAlign: "center", margin: "0.4rem 0 1rem" }}>
          <M>{String.raw`d(x, c') \ge d(x, c) - d(c, c')`}</M>
        </div>
        <p>
          Elkan keeps an <strong>upper bound</strong> on the distance from each point to its assigned
          centroid and <strong>lower bounds</strong> to the others. When centroids move, it nudges
          these bounds by the (cheap-to-compute) distance each centroid travelled. If the upper bound
          to the current centroid is already smaller than the lower bound to every rival, the point{" "}
          <em>provably</em> keeps its assignment — no real distance computed. Two more rules use the
          centroid-to-centroid distances to skip rivals that are obviously too far.
        </p>

        <Callout color="var(--c-clustering)" title={<>Exact, not approximate</>}>
          This is the key distinction from mini-batch k-means. Elkan returns the{" "}
            <strong>identical</strong> result Lloyd&rsquo;s would — it only avoids redundant arithmetic. It
            trades memory (storing the bounds) and bookkeeping for far fewer distance evaluations.
        </Callout>

        <h2>When it helps — and when it doesn&rsquo;t</h2>
        <ul style={ul}>
          <li>
            <strong>Low to moderate dimensions:</strong> big wins, often 2–10× fewer distance
            computations. The triangle-inequality bounds are tight and prune aggressively.
          </li>
          <li>
            <strong>High dimensions:</strong> the bounds loosen, pruning fails, and the extra
            bookkeeping plus the <M>{String.raw`O(k^2)`}</M> centroid-distance step can make it{" "}
            <em>slower</em> than plain Lloyd&rsquo;s. It also costs <M>{String.raw`O(n \cdot k)`}</M> memory for
            the bounds.
          </li>
        </ul>
        <p>
          That trade-off is exactly why scikit-learn chooses automatically: <code>algorithm="elkan"</code>
          {" "}for dense low-dimensional data, the simpler <code>"lloyd"</code> otherwise.
        </p>

        <h2>You rarely call it by hand</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/empty-clusters-and-edge-cases", label: <>← Empty clusters &amp; edge cases</> }} next={{ href: "/learn/k-means/mini-batch", label: <>Next up · Mini-batch k-means →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `# The core pruning rule, in words:
#   keep per-point  upper bound u(x)  to its assigned centroid c(x)
#   keep per-point  lower bounds l(x, j)  to every other centroid j
# after centroids move by delta[j]:
#   u(x)      += delta[c(x)]      # assigned centroid may have moved away
#   l(x, j)   -= delta[j]         # rivals may have moved closer
# if  u(x) <= min_j l(x, j):  assignment is unchanged -> skip all k distances
# only when the bound test fails do you compute a real distance and tighten u(x).`;

const codeLib = `from sklearn.cluster import KMeans

# 'elkan' is exact — identical result to 'lloyd', just fewer distance computations.
# Best on dense, low-dimensional data; sklearn auto-selects when you leave it default.
km = KMeans(n_clusters=8, algorithm="elkan", n_init=10, random_state=0)`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


