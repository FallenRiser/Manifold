import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { MarginLab } from "@/components/labs/MarginLab";

export const metadata = {
  title: "The margin, and why it buys confidence — Manifold",
  description:
    "Infinitely many boundaries achieve identical zero training error, so empirical risk cannot choose between them. The margin can — and margin-based capacity turns out to be something you control rather than something your model architecture hands you.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MarginsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Margins", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 7 minutes"
        title={<>The margin, and why it buys confidence</>}
        intro={<>Two classifiers agree on every training label. Every bound so far treats them as identical — same
          class, same empirical risk, same guarantee. Your eye says one is obviously better. Your eye is right, and
          this chapter is why.</>}
      />

      <div className="lesson">
        <h2>The blind spot</h2>
        <p>
          Everything up to now has priced generalization using two ingredients: how well you fit the data, and how
          big the class was. Neither notices <em>where inside the class</em> your hypothesis ended up. When the data
          is separable there are infinitely many boundaries with identical zero training error, so empirical risk
          minimization is genuinely indifferent among them — it has no basis for a preference. Yet a boundary
          shaved against the nearest point and one sitting squarely in the middle of the gap are obviously not
          equally trustworthy.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>Two separating boundaries, both with exactly 0% training error: one grazes the nearest training point, the other sits centred in the gap. Which should generalize better, and why?</>}
          options={[
            "They're identical — same class, same training error, so the theory is right to be indifferent",
            "The centred one — a small perturbation of the data is less likely to flip a point across it",
            "The grazing one — it uses the training data more efficiently",
          ]}
        />

        <h2>The quantity</h2>
        <p>
          For a linear classifier <M>{String.raw`h(x) = \text{sign}(w \cdot x - b)`}</M>, the{" "}
          <strong>geometric margin</strong> on a point is its signed distance to the boundary, and the margin of
          the classifier is the smallest such distance over the training set:
        </p>
        <MathBlock>{String.raw`\gamma \;=\; \min_{i} \frac{y_i\,(w \cdot x_i - b)}{\|w\|}`}</MathBlock>
        <p>
          Positive <M>{String.raw`\gamma`}</M> means every point is on its correct side. A <em>large</em>{" "}
          <M>{String.raw`\gamma`}</M> means every point is on its correct side <em>with room to spare</em> — and
          room to spare is precisely robustness. Jitter the data slightly, and a point only crosses the boundary if
          it moves further than <M>{String.raw`\gamma`}</M>.
        </p>

        <LabFrame
          accent={GRAY}
          tryThis={<>Rotate and shift the boundary through every separating position you can find, watching the training-error readout the whole time. Then hit &ldquo;snap to the widest gap&rdquo;.</>}
          insight={<>Training error reads <strong>0.000</strong> across every separating position — empirical risk genuinely cannot tell these apart. Meanwhile γ swings enormously, and the <M>{String.raw`1/\gamma^2`}</M> readout swings with the square of it. The circled points at the snap position are the <strong>support vectors</strong>: the only points that matter, and the reason an SVM&rsquo;s solution depends on a handful of examples rather than all of them.</>}
        >
          <MarginLab />
        </LabFrame>

        <h2>Capacity you control, not capacity you inherit</h2>
        <p>
          Here is the reframing that makes margins matter theoretically rather than just aesthetically. Consider not
          all linear classifiers, but only those achieving margin at least <M>{String.raw`\gamma`}</M> on data
          contained in a ball of radius <M>R</M>. That restricted class has a capacity bound that{" "}
          <strong>does not mention the dimension at all</strong>:
        </p>
        <MathBlock>{String.raw`\text{VCdim}\big(\{\text{linear separators with margin} \ge \gamma\}\big) \;\le\; \min\!\left(\frac{R^2}{\gamma^2},\; d\right) + 1`}</MathBlock>
        <p>
          Read what that says. The VC dimension of linear classifiers in <M>{String.raw`\mathbb R^d`}</M> is{" "}
          <M>{String.raw`d+1`}</M>, so in a million-dimensional space the standard bound is hopeless. But if your
          classifier achieves a healthy margin, the effective capacity is{" "}
          <M>{String.raw`R^2/\gamma^2`}</M> — a quantity that depends on the <em>geometry of your solution</em>,
          not on the dimension of the space it lives in.
        </p>

        <Callout color={GRAY} title={<>Why kernel methods aren&rsquo;t a paradox</>}>
          This resolves something that should have been bothering you since the kernel tracks. An{" "}
          <Link href="/learn/support-vector-regression/the-dual-and-the-kernel-trick" style={link}>RBF kernel</Link>{" "}
          maps your data into an <em>infinite-dimensional</em> feature space, where <M>{String.raw`d+1 = \infty`}</M>{" "}
          and the classical VC bound says learning is impossible. Yet kernel SVMs work beautifully. The margin bound
          explains it: the effective capacity is <M>{String.raw`R^2/\gamma^2`}</M>, which stays finite and modest
          no matter how infinite the space is. <strong>You are not penalized for the dimensions you don&rsquo;t
          use.</strong> That is the theoretical licence for the entire kernel programme.
        </Callout>

        <h2>What maximizing the margin really is</h2>
        <p>
          The support vector machine is usually introduced as an optimisation idea — find the widest street between
          the classes. This chapter lets you see it as something else entirely: <strong>a capacity-control
          strategy</strong>. Because capacity scales as <M>{String.raw`R^2/\gamma^2`}</M>, maximizing{" "}
          <M>{String.raw`\gamma`}</M> is literally minimizing the effective size of your hypothesis class, chosen{" "}
          <em>after</em> seeing the data.
        </p>
        <p>
          It also explains the shape of the soft-margin objective. Since the margin of a canonical separator is{" "}
          <M>{String.raw`1/\|w\|`}</M>, maximizing margin means <em>minimizing</em>{" "}
          <M>{String.raw`\|w\|^2`}</M> — which is exactly the ridge-style penalty you already know from{" "}
          <Link href="/learn/regularized-regression/penalty-vs-constraint" style={link}>regularized regression</Link>.
          The regularizer people describe as &ldquo;keeping the weights small&rdquo; is, read through this lens,
          &ldquo;keeping the effective capacity small&rdquo;. Same term, deeper reason.
        </p>
        <p>
          The next page turns this into an actual generalization bound and shows what it buys — and then we look at
          the algorithm that made the whole margin story famous by refusing to overfit when everyone expected it to.
        </p>

        <PrevNext
          prev={{ href: "/learn/learning-theory/rademacher-complexity", label: <>← Rademacher complexity</> }}
          next={{ href: "/learn/learning-theory/margin-bounds", label: <>Next up · Margin-based bounds →</> }}
        />
      </div>
    </article>
  );
}
