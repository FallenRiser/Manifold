import Link from "next/link";
import { ImpurityLab } from "@/components/labs/ImpurityLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "What makes a good split? — Manifold",
  description:
    "A good split makes each side purer than the whole. Measure impurity with Gini, and pick the split with the largest information gain — the drop in impurity a question buys.",
};

const TREES = "var(--c-trees)";

export default function GoodSplitPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 1 · intuition", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>What makes a good split?</>}
        intro={<>
          A tree grows by asking questions, so everything rides on asking a <em>good</em> one. The best
          question is the one whose answer leaves you most certain — it should sort a mixed crowd into two
          groups that each lean strongly one way. To automate that, we need to put a number on
          &ldquo;mixed.&rdquo;
        </>}
      />

      <div className="lesson">
        <h2>Purity: how mixed is a group?</h2>
        <p>
          Call a group <strong>pure</strong> if everyone in it shares a label, and <strong>impure</strong> if
          it&rsquo;s a jumble. A pure group is easy — predict that one label and you&rsquo;re never wrong. A
          50/50 group is the worst case: whatever you guess, you&rsquo;re wrong half the time. We want a
          score that is <em>zero</em> for a pure group and <em>largest</em> for an even split.
        </p>
        <p>
          The <strong>Gini impurity</strong> does exactly this. If a fraction <M>{String.raw`p_k`}</M> of the
          group belongs to class <M>{String.raw`k`}</M>, then
        </p>
        <MathBlock>{String.raw`G = 1 - \sum_k p_k^2`}</MathBlock>
        <p>
          For two classes at fractions <M>{String.raw`p`}</M> and <M>{String.raw`1-p`}</M>, that&rsquo;s{" "}
          <M>{String.raw`G = 1 - p^2 - (1-p)^2 = 2p(1-p)`}</M>. All one class (<M>{String.raw`p=0`}</M> or{" "}
          <M>{String.raw`1`}</M>) gives <M>{String.raw`G = 0`}</M>; a dead-even split (<M>{String.raw`p=\tfrac12`}</M>)
          gives the maximum <M>{String.raw`G = 0.5`}</M>. One number, and it does the whole job.
        </p>

        <h2>Information gain: what a question buys</h2>
        <p>
          A split cuts the parent group into a left child and a right child. Each child has its own Gini. To
          score the split, compare the parent&rsquo;s impurity to the children&rsquo;s — weighted by how many
          points landed on each side (a pure child of two points is worth less than a pure child of twenty):
        </p>
        <MathBlock>{String.raw`\text{gain} = G_{\text{parent}} - \frac{n_L}{n}\,G_L - \frac{n_R}{n}\,G_R`}</MathBlock>
        <p>
          That drop is the <strong>information gain</strong>. A useless question leaves the children as mixed
          as the parent — gain near zero. A great question sends almost all of one class left and the other
          right — large gain. The tree&rsquo;s rule for choosing a split is simply: <em>try every threshold
          and take the one with the most gain.</em>
        </p>

        <h2>Find the best cut by hand</h2>
        <p>
          Fifteen points, two classes, strung out along a single feature. Drag the split and watch the two
          children&rsquo;s Gini scores and the resulting gain. The green dashes mark the split CART would
          pick — see if you can find it yourself first.
        </p>

        <PredictPrompt
          accent={TREES}
          prompt={<>Where will the best split land — right in the visual middle, or somewhere off-centre?</>}
          options={["Dead centre (~0.5)", "Off-centre, wherever one side turns pure", "Far left"]}
        />

        <LabFrame
          accent={TREES}
          tryThis={<>Drag the black handle across the strip. Find the cut that makes one side as pure as possible, and read the gain.</>}
          insight={<>The best split sits at ~0.605, not the middle — it lands exactly where the right side becomes 100% one class (Gini 0.000, gain 0.290). Greedy splitting chases a pure child, even at the cost of leaving the other side still mixed. That leftover mixture is what the <em>next</em> split will attack.</>}
        >
          <ImpurityLab />
        </LabFrame>

        <p>
          Notice the greedy instinct in action: the winning cut doesn&rsquo;t balance the two sides, it
          <em> purifies one of them</em>. The right child becomes entirely one class; the left is left holding
          the ambiguous middle, to be split again later. This is how a tree reasons at every single node.
        </p>

        <Callout color={TREES} title={<>Gini or entropy?</>}>
          Gini isn&rsquo;t the only impurity score — <strong>entropy</strong> (<M>{String.raw`-\sum_k p_k \log_2 p_k`}</M>)
          does the same job and gives nearly identical trees. We&rsquo;ll compare them properly on the{" "}
          <Link href="/learn/decision-trees/impurity-measures" style={link}>next chapter&rsquo;s first page</Link>.
          For intuition, Gini is enough: zero when pure, biggest when evenly mixed.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/decision-trees", label: <>← Splitting the space</> }}
          next={{ href: "/learn/decision-trees/growing-the-tree", label: <>Next up · Growing the whole tree →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
