import Link from "next/link";
import { DecisionTreeLab } from "@/components/labs/DecisionTreeLab";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "How a tree overfits — Manifold",
  description:
    "A tree's capacity is unbounded: grown freely, it isolates every training point, hits 100% train accuracy, and memorises the noise. Seeing the train–test gap open is the case for pruning.",
};

const TREES = "var(--c-trees)";

export default function HowTreesOverfitPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>How a tree overfits</>}
        intro={<>
          Most models have a fixed number of parameters, which caps how much they can contort. A tree
          doesn&rsquo;t: it can always grow one more level. That unbounded capacity is its gift and its
          curse — left unchecked, a tree memorises rather than learns.
        </>}
      />

      <div className="lesson">
        <h2>Unbounded capacity means guaranteed memorisation</h2>
        <p>
          Here is the uncomfortable fact: on any dataset with no two identical points carrying different
          labels, a fully grown tree can reach <strong>100% training accuracy</strong>. It simply keeps
          splitting until every leaf holds a single point — or a single pure cluster of points. Nothing stops
          it. A perfect training score isn&rsquo;t evidence of a good model; for a tree it&rsquo;s the default
          outcome, and it&rsquo;s worthless.
        </p>
        <p>
          The reason it&rsquo;s worthless is that real data is noisy. The 10% of labels flipped in the dataset
          below are <em>wrong</em>, but a deep tree can&rsquo;t tell — it carves out a tiny box around each
          mislabelled point and &ldquo;explains&rdquo; it. Those boxes fit the training noise and actively
          mislead on new data.
        </p>

        <LabFrame
          accent={TREES}
          tryThis={<>Your goal this time: find the depth with the <em>highest test accuracy</em>, then keep going and watch test accuracy fall while train accuracy climbs to 100%.</>}
          insight={<>Test accuracy peaks around depth 3 (~84%) with a handful of leaves. Push to depth 7–8 and train hits 100.0% while test sits near 81% — the tree has spent its extra depth memorising noise. The best tree is the shallow one, and you can only find it by watching the test bar, never the train bar.</>}
        >
          <DecisionTreeLab />
        </LabFrame>

        <h2>Why trees overfit harder than most models</h2>
        <ul style={ul}>
          <li><strong>They interpolate.</strong> A leaf can shrink to a single point, so a tree can pass
            exactly through every training label — there is no built-in smoothness to resist noise.</li>
          <li><strong>Capacity grows with depth without limit.</strong> Each level can double the number of
            leaves. Depth is a capacity dial with no natural stop.</li>
          <li><strong>Greedy splits compound.</strong> An early split that chased noise sends its mistake down
            to every descendant, and later splits dutifully carve around it.</li>
        </ul>

        <h2>Two ways to stop it</h2>
        <p>
          Both cures work on the same lever — tree size — from opposite ends:
        </p>
        <ol style={ol}>
          <li><strong>Pre-pruning</strong> — stop growing early, using rules like a maximum depth or a minimum
            number of points per leaf. Cheap, but it decides where to stop <em>before</em> seeing what a
            deeper split would have revealed.</li>
          <li><strong>Post-pruning</strong> — grow the tree out fully, then cut back the branches that
            don&rsquo;t earn their keep. More work, but it judges each branch with the whole tree in view.</li>
        </ol>
        <p>The next two pages take each in turn.</p>

        <Callout color={TREES} title={<>The deeper lesson</>}>
          A single tree&rsquo;s eagerness to memorise is <em>high variance</em>: tiny changes in the data
          produce wildly different trees. Pruning tames it by hand — but the ensembles ahead tame it
          automatically, by averaging many high-variance trees into one low-variance predictor. Keep this
          failure mode in mind; it&rsquo;s the whole reason random forests exist.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/decision-trees/numeric-and-categorical-splits", label: <>← Numeric & categorical splits</> }}
          next={{ href: "/learn/decision-trees/pre-pruning", label: <>Next up · Pre-pruning: the stopping knobs →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const ol: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
