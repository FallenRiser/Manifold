import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { RidgePolyLab } from "@/components/labs/RidgePolyLab";

export const metadata = {
  title: "Regularization as capacity control — Manifold",
  description:
    "A penalty on the weights is a continuous dial on the size of your hypothesis class. That's why λ is a model-selection parameter rather than a fitting parameter, and why it must be chosen on held-out data.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RegAsCapacityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capacity", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 7 minutes"
        title={<>Regularization as capacity control</>}
        intro={<>The most useful thing to understand about <M>{String.raw`\lambda`}</M>: it is not part of fitting
          your model. It is a continuous dial on <em>which class</em> your model is fitted from — which is why it
          can never be chosen on the training set.</>}
      />

      <div className="lesson">
        <h2>The penalty is a constraint in disguise</h2>
        <p>
          Ridge regression minimises the penalized objective on the left. By Lagrangian duality it is equivalent to
          the constrained problem on the right, for some radius <M>{String.raw`B(\lambda)`}</M>:
        </p>
        <MathBlock>{String.raw`\min_w\; \hat R_S(w) + \lambda\|w\|_2^2 \qquad\Longleftrightarrow\qquad \min_{\|w\|_2 \le B(\lambda)}\; \hat R_S(w)`}</MathBlock>
        <p>
          Read the right-hand side as a definition of a hypothesis class: <em>all linear models whose weight
          vector fits inside a ball of radius <M>B</M></em>. Large <M>{String.raw`\lambda`}</M> means small{" "}
          <M>B</M> means a small class. Small <M>{String.raw`\lambda`}</M> means a big one. Sweeping{" "}
          <M>{String.raw`\lambda`}</M> traverses a nested family exactly as{" "}
          <Link href="/learn/model-selection/structural-risk-minimization" style={link}>SRM</Link> describes —
          except the levels are continuous rather than integer, which is strictly nicer.
        </p>
        <p>
          The <Link href="/learn/regularized-regression/penalty-vs-constraint" style={link}>regularized regression
          track</Link> derives this equivalence properly and shows the geometry. What matters here is the
          consequence.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>Why can't you choose λ by picking the value that minimises the training objective, the way you choose the weights?</>}
          options={[
            "Because the training objective isn't differentiable in λ",
            "Because the training objective is always minimised at λ = 0 — no penalty fits the training data best",
            "Because λ appears in the penalty rather than the loss",
          ]}
        />

        <h2>Why <M>{String.raw`\lambda`}</M> cannot be trained</h2>
        <p>
          Set <M>{String.raw`\lambda = 0`}</M> and you get the largest class, which always achieves the lowest
          training error — every smaller class is a subset. So minimising the training objective over{" "}
          <M>{String.raw`\lambda`}</M> gives <M>{String.raw`\lambda = 0`}</M> every single time, whatever your
          data looks like. The training set has no information about the right amount of regularization, in the
          strong sense that its answer is a constant.
        </p>
        <p>
          That is what makes <M>{String.raw`\lambda`}</M> a <strong>model-selection parameter</strong> rather than a
          fitting parameter, and it is the sharpest illustration of the two-level structure from earlier: the
          inner problem picks <M>w</M>, the outer problem picks the class, and the outer problem needs held-out
          data by construction, not by convention.
        </p>

        <LabFrame
          accent={GRAY}
          tryThis={<>Push λ to its smallest value and look at the fitted curve, then walk it up step by step, watching both the curve and the test error.</>}
          insight={<>At tiny λ the degree-9 polynomial contorts through every training point — a big class, found precisely, fitting noise. As λ grows the same degree-9 model becomes progressively smoother, until it is effectively a low-order curve. <strong>The degree never changed; the effective class did.</strong> That is capacity control as a continuous dial, and it&rsquo;s why you can keep a flexible model and still not overfit.</>}
        >
          <RidgePolyLab />
        </LabFrame>

        <h2>Every regularizer is the same move</h2>
        <p>
          Once you see the pattern, the zoo collapses into one idea — each of these shrinks the effective class,
          differing only in <em>which</em> functions they make expensive:
        </p>
        <ul>
          <li><strong>L2 / ridge</strong> — a ball of weight vectors; makes large coefficients expensive, shrinking all of them smoothly.</li>
          <li><strong>L1 / lasso</strong> — a diamond; its corners make <em>whole features</em> free to discard, which is why it selects.</li>
          <li><strong>Tree depth and min-samples-leaf</strong> — a cap on the number of leaves, so a discrete version of the same dial.</li>
          <li><strong>Dropout</strong> — the network can&rsquo;t rely on any single unit, which restricts the functions reachable.</li>
          <li><strong>Data augmentation</strong> — restricts to functions invariant to the augmentations, which is capacity control that <em>adds</em> information rather than removing flexibility.</li>
        </ul>

        <Callout color={GRAY} title={<>The practical rule this gives you</>}>
          <strong>Anything that changes the size of your class must be chosen on held-out data.</strong> Depth,{" "}
          <M>{String.raw`\lambda`}</M>, number of features, <M>k</M> in k-NN, number of epochs, dropout rate —
          all outer-loop parameters, all scored on data the fit never saw. And because they all move the same
          underlying quantity, they interact: doubling your features while holding{" "}
          <M>{String.raw`\lambda`}</M> fixed is a capacity increase you didn&rsquo;t intend. Tune capacity knobs{" "}
          <em>jointly</em>, or accept that you are exploring a diagonal through the space rather than the space.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/model-selection/structural-risk-minimization", label: <>← Structural risk minimization</> }}
          next={{ href: "/learn/model-selection/early-stopping", label: <>Next up · Early stopping →</> }}
        />
      </div>
    </article>
  );
}
