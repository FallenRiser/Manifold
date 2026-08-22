import Link from "next/link";
import { CorrelatedVarianceLab } from "@/components/labs/CorrelatedVarianceLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Why averaging works — Manifold",
  description:
    "The one formula behind random forests: the variance of an average of B trees with pairwise correlation ρ is ρσ² + (1−ρ)σ²/B. Averaging kills the second term; only decorrelation lowers the first.",
};

const TREES = "var(--c-trees)";
const GREY = "var(--c-metrics)";

export default function WhyAveragingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 3 · theory", color: GREY }]}
        time="about 8 minutes"
        title={<>Why averaging works</>}
        intro={<>
          Everything in this track — bagging, out-of-bag, the random-subspace trick, the whole reason forests
          exist — collapses into a single line of algebra: the variance of an average of correlated predictors.
          Derive it once and every design choice becomes obvious.
        </>}
      />

      <div className="lesson">
        <h2>The variance of an average</h2>
        <p>
          Model the <M>{String.raw`B`}</M> trees as identically distributed predictors, each with variance{" "}
          <M>{String.raw`\sigma^2`}</M>, and each <em>pair</em> correlated by <M>{String.raw`\rho`}</M> (they came
          from one dataset, so they&rsquo;re not independent). The forest predicts their mean. Using the standard
          identity for the variance of a sum,
        </p>
        <MathBlock>{String.raw`\operatorname{Var}\!\left(\frac{1}{B}\sum_{b=1}^{B}\hat{f}_b\right) = \frac{1}{B^2}\left(\sum_b \operatorname{Var}(\hat{f}_b) + \sum_{i\neq j}\operatorname{Cov}(\hat{f}_i,\hat{f}_j)\right)`}</MathBlock>
        <p>
          There are <M>{String.raw`B`}</M> variance terms each <M>{String.raw`\sigma^2`}</M>, and{" "}
          <M>{String.raw`B(B-1)`}</M> covariance terms each <M>{String.raw`\rho\sigma^2`}</M>. Substituting and
          simplifying gives the formula that runs the whole family:
        </p>
        <MathBlock>{String.raw`\operatorname{Var}(\text{forest}) = \rho\,\sigma^2 \;+\; \frac{1-\rho}{B}\,\sigma^2`}</MathBlock>

        <h2>Read the two terms</h2>
        <p>The entire theory of random forests is in how these two pieces behave:</p>
        <ul style={ul}>
          <li>The second term, <M>{String.raw`\frac{1-\rho}{B}\sigma^2`}</M>, <strong>vanishes as{" "}
            <M>{String.raw`B\to\infty`}</M></strong>. This is what adding trees buys you — and why more trees
            never hurt: you&rsquo;re only ever shrinking this term toward zero.</li>
          <li>The first term, <M>{String.raw`\rho\sigma^2`}</M>, <strong>does not depend on{" "}
            <M>{String.raw`B`}</M> at all</strong>. It&rsquo;s a floor. No amount of averaging touches it. The
            only way to lower it is to lower <M>{String.raw`\rho`}</M> — decorrelate the trees.</li>
        </ul>
        <p>
          There is the justification for every design choice in one line. <strong>Bagging</strong> and the{" "}
          <strong>random subspace trick</strong> exist for exactly one purpose: to push <M>{String.raw`\rho`}</M>{" "}
          down, lowering the floor that averaging alone can never reach.
        </p>

        <PredictPrompt
          accent={TREES}
          prompt={<>With correlation fixed at <M>{String.raw`\rho = 0.5`}</M>, how far can adding trees drive the variance down?</>}
          options={["To zero", "To about half the single-tree variance (the ρ floor)", "It barely changes"]}
        />

        <LabFrame
          accent={TREES}
          tryThis={<>First drag <strong>B</strong> with ρ held at 0.5 — watch the curve flatten onto the floor. Then drag <strong>ρ</strong> down and watch the whole floor drop.</>}
          insight={<>At ρ = 0.5, even infinite trees only halve the variance — the curve slams into a floor at 0.5σ². Adding trees (B) melts the (1−ρ)/B term but is powerless against the floor. Only lowering ρ moves the floor. That&rsquo;s the mathematical case for decorrelation: bagging alone (high ρ) leaves a high floor; feature subsampling drops ρ and lets averaging reach lower.</>}
        >
          <CorrelatedVarianceLab />
        </LabFrame>

        <Callout color={GREY} title={<>The trade-off, made exact</>}>
          The random-subspace knob <M>{String.raw`m`}</M> lowers <M>{String.raw`\rho`}</M> — good, it lowers the
          floor — but it also raises each tree&rsquo;s own variance <M>{String.raw`\sigma^2`}</M> a little (weaker
          trees). The optimum <M>{String.raw`m`}</M> minimises the product <M>{String.raw`\rho\sigma^2`}</M>, not{" "}
          <M>{String.raw`\rho`}</M> alone — which is exactly the interior peak you saw on the{" "}
          <Link href="/learn/random-forests/decorrelating-the-trees" style={link}>decorrelation page</Link>.
          Theory and the lab agree.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/random-forests/quantile-regression-forests", label: <>← Quantile forests & prediction intervals</> }}
          next={{ href: "/learn/random-forests/strength-and-correlation", label: <>Next up · Strength & correlation: Breiman&rsquo;s bound →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
