import { PredictPrompt } from "@/components/PredictPrompt";
import { KMeansLab } from "@/components/labs/KMeansLab";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { LessonHeader, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "What is clustering? — Manifold",
  description:
    "Clustering finds structure in unlabeled data: groups of points that belong together. k-Means is the canonical algorithm — here's the intuition, interactively.",
};

export default function KMeansHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "Unsupervised", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>What is clustering?</>}
        intro={<>
          Linear regression had an answer key — every row came with a target to predict. Clustering
        works in the dark: no labels, just points. The job is to discover the groups that were
        there all along.
        </>}
      />

      <div className="lesson">
        <ModelAnatomy
          accent="var(--c-clustering)"
          form={<>k centroids — every point belongs to its nearest one</>}
          loss={<>Inertia: total squared distance from points to their centroid</>}
          optimiser={<>Lloyd&rsquo;s alternation — assign, update, repeat until still</>}
        />

        <h2>Supervised vs unsupervised</h2>
        <p>
          In the regression track, every example came as a pair: features <strong>and</strong> the
          right answer. The model learned the mapping between them. That&rsquo;s{" "}
          <strong>supervised</strong> learning.
        </p>
        <p>
          Clustering is <strong>unsupervised</strong>: you get the features and nothing else. There
          is no &ldquo;correct&rdquo; output to copy. Instead, the goal is structure — which points
          naturally belong together? Think customers who shop alike, pixels of a similar colour,
          documents about the same topic. Nobody labelled them; the grouping has to be{" "}
          <em>discovered</em>.
        </p>

        <h2>The goal: tight, separated groups</h2>
        <p>
          A good clustering has two properties: points in the same group are <strong>close to each
          other</strong>, and the groups are <strong>far apart</strong>. That&rsquo;s it. The whole
          field is different answers to &ldquo;close&rdquo; and &ldquo;how many groups.&rdquo;
        </p>
        <p>
          <strong>k-Means</strong> is the canonical first answer. You tell it how many groups to
          find (that&rsquo;s the <em>k</em>), and it places <em>k</em> centre points — centroids —
          then shuffles them around until each one sits in the middle of a tight cluster.
        </p>

        <PredictPrompt
          accent="var(--c-clustering)"
          prompt={<>You give k-means <em>k</em> = 3 on data that clearly has 4 blobs. What does it do?</>}
          options={["Refuses to converge", "Converges happily — two blobs end up sharing a centroid", "Detects the 4th blob and adds a centroid"]}
          nudge={<>Locked in. In the lab below, set k to 3, run to convergence, and see for yourself.</>}
        />

        <h2>Watch it work</h2>
        <p>
          Below is the entire algorithm. Press <strong>Run to convergence</strong> and watch the
          centroids (the ✛ marks) crawl into the heart of each blob while the points recolour to
          their nearest centre. Or hit <strong>Assign + update</strong> to take it one step at a
          time. Change <em>k</em>, or generate new data, and run it again.
        </p>

        <KMeansLab />

        <p>
          Notice the <strong>inertia</strong> number only ever falls. Every step makes the clusters
          tighter, never looser — which is exactly why the algorithm is guaranteed to stop. The next
          few pages unpack each piece: what &ldquo;distance&rdquo; really means, the two-phase loop,
          and why that monotonic drop guarantees convergence.
        </p>

        <PrevNext prev={{ href: "/learn/linear-regression", label: <>← Linear regression</> }} next={{ href: "/learn/k-means/the-unsupervised-landscape", label: <>Next up · The unsupervised landscape →</> }} />
      </div>
    </article>
  );
}

