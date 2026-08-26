import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { StabilityLab } from "@/components/labs/StabilityLab";

export const metadata = {
  title: "Algorithmic stability — Manifold",
  description:
    "A completely different route to a guarantee: forget how big the hypothesis class is and ask whether your algorithm's output changes when one training example is removed. It bounds the algorithm you actually run, not the worst one your class permits.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function StabilityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Stability", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 8 minutes"
        title={<>Algorithmic stability</>}
        intro={<>Every bound so far has analysed the hypothesis <em>class</em> — and paid for hypotheses your
          optimiser would never return. This chapter throws that framing away and asks a question about the
          algorithm itself, one you can answer by deleting a single row.</>}
      />

      <div className="lesson">
        <h2>A different question entirely</h2>
        <p>
          Uniform convergence bounds the worst hypothesis in the class, which is a strange thing to do when your
          algorithm returns one specific hypothesis and has strong opinions about which. Gradient descent from a
          small initialization does not wander into pathological corners of the parameter space; ridge regression
          with a large penalty cannot return a wild function even though the class contains many. All that
          structure is invisible to a VC bound.
        </p>
        <p>
          Stability asks instead: <strong>if I delete one training example and rerun, how much does the output
          change?</strong> The intuition is direct — an algorithm whose predictions swing wildly when one example
          vanishes was <em>relying</em> on that example, which is memorization. An algorithm that barely notices
          cannot have memorized anything, and therefore cannot be overfitting.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>1-nearest neighbour has zero training error on any dataset with no repeated inputs. What happens to its predictions when you delete one training point?</>}
          options={[
            "Almost nothing — one point out of many barely matters",
            "The deleted point's whole neighbourhood changes prediction at once",
            "Only that exact point's prediction changes",
          ]}
        />

        <LabFrame
          accent={GRAY}
          tryThis={<>With 1-NN selected, walk the deletion slider through every point and watch β. Then switch to ridge and do it again — and once you&rsquo;ve seen the difference, drag λ upward.</>}
          insight={<>1-NN has <strong>zero training error and terrible stability</strong> — deleting a point hands its territory to a neighbour and predictions jump. Ridge has nonzero training error and moves barely at all, and raising λ makes it steadier still. Notice what that means: <strong>the parameter you tune for generalization is literally a stability dial.</strong> Training error and stability are measuring different things, and only one of them predicts the test set.</>}
        >
          <StabilityLab />
        </LabFrame>

        <h2>The definition</h2>
        <p>
          Let <M>{String.raw`S`}</M> be a training set and <M>{String.raw`S^{\setminus i}`}</M> the same set with
          the <M>i</M>-th example removed. An algorithm <M>{String.raw`\mathcal A`}</M> has{" "}
          <strong>uniform stability</strong> <M>{String.raw`\beta`}</M> if for every sample, every index, and every
          test point <M>z</M>:
        </p>
        <MathBlock>{String.raw`\big|\, \ell(\mathcal A(S), z) - \ell(\mathcal A(S^{\setminus i}), z) \,\big| \;\le\; \beta`}</MathBlock>
        <p>
          In words: removing any single training example changes the loss on any point by at most{" "}
          <M>{String.raw`\beta`}</M>. Smaller is more stable. Note this is a property of the{" "}
          <strong>algorithm</strong> — the whole procedure including its regularization and its optimiser — not of
          the hypothesis class. Two algorithms searching the identical class can have wildly different stability,
          which is exactly the information uniform convergence discards.
        </p>

        <h2>What is and isn&rsquo;t stable</h2>
        <ul>
          <li>
            <strong>Ridge regression is stable</strong>, with <M>{String.raw`\beta = O(1/(\lambda n))`}</M>. Note
            what that expression does: stability improves with more data <em>and</em> with a stronger penalty. The
            regularization parameter you tune by cross-validation is, from this angle, a stability knob — and
            that&rsquo;s a genuine explanation of why{" "}
            <Link href="/learn/regularized-regression/ridge-regression" style={link}>ridge</Link> generalizes, not
            merely a description.
          </li>
          <li>
            <strong>Hard-margin SVM is stable</strong> for similar reasons — the norm penalty bounds how much one
            point can move the solution.
          </li>
          <li>
            <strong>1-nearest neighbour is not stable at all.</strong> <M>{String.raw`\beta`}</M> does not shrink
            with <M>n</M>: deleting a point always reassigns its entire Voronoi cell. Consistency of k-NN needs{" "}
            <M>{String.raw`k \to \infty`}</M> for exactly this reason — averaging over more neighbours is what buys
            stability, as the{" "}
            <Link href="/learn/k-nearest-neighbors/consistency-of-k-nn" style={link}>k-NN consistency page</Link>{" "}
            works through from the bias–variance side.
          </li>
          <li>
            <strong>Stochastic gradient descent is stable</strong> when run for few enough epochs with a small
            enough step size — a result of Hardt, Recht and Singer (2016). Each SGD step can only move the
            parameters so far, so a single example&rsquo;s total influence is bounded by how often it was visited.{" "}
            <strong>This is a genuine theoretical explanation of early stopping</strong>: training longer is
            literally becoming less stable.
          </li>
        </ul>

        <Callout color={GRAY} title={<>Why this route is worth having</>}>
          Stability bounds analyse <em>the algorithm you actually ran</em>, which is the single biggest weakness of
          everything before this chapter. They apply cleanly to infinite and even unbounded classes, where VC
          dimension is useless. And they explain a family of practices — regularization, averaging, early
          stopping, bagging — under one mechanism: <strong>every one of them reduces the influence of any
          individual example</strong>. That is a satisfying unification, and it&rsquo;s reachable without a single
          growth function.
        </Callout>

        <p>
          The next page proves the claim that makes stability more than an intuition: that a stable algorithm
          generalizes, with a bound whose proof is shorter than anything in the VC chapter.
        </p>

        <PrevNext
          prev={{ href: "/learn/learning-theory/boosting-and-margins", label: <>← Why boosting doesn&rsquo;t overfit (usually)</> }}
          next={{ href: "/learn/learning-theory/stability-implies-generalization", label: <>Next up · Stability implies generalization →</> }}
        />
      </div>
    </article>
  );
}
