import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { TriangleBound } from "@/components/figures/kmeans/KmeansDiagrams";
import { GroupedBars } from "@/components/figures/kmeans/KmeansCharts";
import { ELKAN_COUNTS, ELKAN_TIMES } from "@/components/figures/kmeans/data.generated";

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

        <TriangleBound
          caption={<>The whole idea, in one triangle. If the two centroids are further from each other
            than twice the distance from x to the one it already belongs to, then c₂ cannot possibly be
            closer, and the dashed distance never has to be computed. No approximation is involved —
            the skipped comparison is one whose answer was already determined.</>}
        />

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
        <p>
          The honest answer has two halves that disagree, so it is worth separating the arithmetic from
          the stopwatch.
        </p>
        <ul style={ul}>
          <li>
            <strong>Distance computations: a large, reliable win.</strong> In low to moderate
            dimensions the bounds are tight and prune hard — measured at <strong>92–94% fewer</strong>{" "}
            distance evaluations in the first figure below, better than the 2–10× usually quoted.
          </li>
          <li>
            <strong>High dimensions: the pruning itself degrades.</strong> The bounds loosen, fewer
            comparisons are skipped, and the <M>{String.raw`O(k^2)`}</M> centroid-distance step plus{" "}
            <M>{String.raw`O(n \cdot k)`}</M> memory for the bounds still has to be paid.
          </li>
          <li>
            <strong>Wall-clock, on a modern machine: usually a loss.</strong> Fewer operations is not
            the same as less time. Lloyd&rsquo;s assign step is a single matrix product that runs in
            threaded BLAS across every core; Elkan&rsquo;s bound checks are a branchy per-point loop
            that neither vectorises nor parallelises. In the second figure below Elkan is slower at
            every size tested, and <em>the gap widens as k grows</em> — exactly where the theory says
            it should win most.
          </li>
        </ul>
        <p>
          scikit-learn used to make this choice for you, and no longer does. <code>algorithm="auto"</code>{" "}
          was deprecated in 1.1 and removed in 1.3; in current versions it raises{" "}
          <code>InvalidParameterError</code>, and the default is plain <code>"lloyd"</code> whatever your
          data looks like. That change is itself the clearest evidence for the paragraph above — the
          maintainers stopped routing anyone to Elkan because, on the hardware people actually run,
          it stopped being the faster option.
        </p>
        <p>
          None of which makes the idea worthless. It is the cleanest example in this track of a
          technique that is unambiguously better on the metric its inventor optimised, and a loss on
          the metric you care about, because the machine underneath changed in the twenty years
          between. Keep the triangle inequality; it reappears in nearest-neighbour search, where the
          same trick is still decisive.
        </p>

        <GroupedBars
          ylabel="point-to-centroid distances computed"
          logScale
          format={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)))}
          groups={ELKAN_COUNTS.map((r) => ({
            label: `n=${r.n}, d=${r.d}, k=${r.k}`,
            values: [r.lloyd, r.elkan],
          }))}
          series={[
            { name: "Lloyd", color: "var(--c-clustering)" },
            { name: "Elkan", color: "var(--good)" },
          ]}
          caption={<>The pruning claim, counted rather than asserted, on a hand-written implementation
            of both (log scale). Elkan computes <strong>92–94% fewer</strong> distances — better than
            the 2–10× the literature usually quotes. The bounds work exactly as advertised.</>}
        />

        <GroupedBars
          ylabel="seconds to fit — scikit-learn's own implementations"
          format={(v) => v.toFixed(3)}
          groups={ELKAN_TIMES.map((r) => ({
            label: `n=${r.n.toLocaleString()}, k=${r.k}`,
            values: [r.lloydTime, r.elkanTime],
          }))}
          series={[
            { name: "Lloyd", color: "var(--c-clustering)" },
            { name: "Elkan", color: "var(--good)" },
          ]}
          caption={<>And the same comparison on the clock, which goes the other way. Elkan is{" "}
            <strong>slower</strong> at every size measured, and the gap gets worse as k grows —
            {" "}{ELKAN_TIMES[2].speedup}× at k = {ELKAN_TIMES[2].k}, in precisely the regime where doing less
            arithmetic should help most.

            The explanation is not that the theory is wrong; it is that the theory counts the wrong
            thing. Lloyd&rsquo;s assign step is a single large matrix product, which runs in threaded
            BLAS across every core of the machine. Elkan&rsquo;s bound checks are a branchy loop over
            one point at a time, which vectorises badly and parallelises worse. Removing fifteen
            sixteenths of the operations does not pay if each survivor runs an order of magnitude
            slower. Measured in <code>scripts/kmeans_cases.py</code> on a 12-thread build; on a
            single-threaded one the comparison is much closer.</>}
        />

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


