import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Early stopping — Manifold",
  description:
    "Stopping training early is capacity control, not impatience: the set of functions reachable in t steps grows with t, so the step budget is a hypothesis-class dial with a theorem behind it.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function EarlyStoppingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capacity", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 6 minutes"
        title={<>Early stopping</>}
        intro={<>The cheapest regularizer there is, and the one most often described as merely pragmatic. It is
          capacity control in the same sense as <M>{String.raw`\lambda`}</M> — with a theorem attached.</>}
      />

      <div className="lesson">
        <h2>The step budget is a class</h2>
        <p>
          Start gradient descent at <M>{String.raw`w_0 = 0`}</M> and take <M>t</M> steps of size{" "}
          <M>{String.raw`\eta`}</M>. Whatever you end up with satisfies{" "}
          <M>{String.raw`\|w_t\| \le \eta t \max_s\|\nabla_s\|`}</M> — the parameters cannot have travelled
          further than the total distance you allowed them. So the set of functions reachable in <M>t</M> steps is
          contained in a ball whose radius grows with <M>t</M>:
        </p>
        <MathBlock>{String.raw`\mathcal H_t \;=\; \{\, w : w \text{ reachable in } t \text{ steps} \,\} \qquad \mathcal H_1 \subset \mathcal H_2 \subset \cdots`}</MathBlock>
        <p>
          That is a nested family, indexed by training time, and stopping early selects a level of it. Compare it
          with the previous page and the correspondence is exact: <M>{String.raw`\lambda`}</M> bounds{" "}
          <M>{String.raw`\|w\|`}</M> directly; <M>t</M> bounds it by rationing how far you may travel. For linear
          least squares with small steps the correspondence is more than an analogy — early-stopped gradient
          descent is <em>provably</em> close to ridge regression with{" "}
          <M>{String.raw`\lambda \approx 1/(\eta t)`}</M>, shrinking the same directions in the same order,
          smallest singular values first.
        </p>

        <h2>The theorem</h2>
        <p>
          Hardt, Recht and Singer (2016) proved that stochastic gradient descent is{" "}
          <Link href="/learn/learning-theory/algorithmic-stability" style={link}>uniformly stable</Link> with a
          bound that <strong>grows with the number of steps</strong>. Each SGD step can move the parameters only
          so far, so a single training example&rsquo;s total influence is bounded by how many times it was
          visited. Combined with{" "}
          <Link href="/learn/learning-theory/stability-implies-generalization" style={link}>stability implies
          generalization</Link>:
        </p>
        <MathBlock>{String.raw`\text{generalization gap} \;\lesssim\; \beta(t) \quad \text{with } \beta \text{ increasing in } t`}</MathBlock>
        <p>
          <strong>Training longer is literally becoming less stable</strong>, and the gap bound widens as it does.
          That is a real explanation, not a metaphor — and it is notable for applying to deep networks, where the
          capacity-counting arguments of classical theory give nothing at all.
        </p>

        <Callout color={GRAY} title={<>Which makes the stopping rule a selection problem</>}>
          If <M>t</M> is a capacity parameter, then by the rule from the previous page it must be chosen on
          held-out data — which is exactly what a validation-loss patience criterion is. &ldquo;Stop when
          validation loss hasn&rsquo;t improved for 10 epochs&rdquo; is not a heuristic bolted onto training; it is
          model selection over the family <M>{String.raw`\{\mathcal H_t\}`}</M>, run online. And it inherits the{" "}
          <Link href="/learn/model-selection/the-selection-trap" style={link}>selection trap</Link>: the validation
          loss <em>at the stopping epoch</em> is the minimum over every epoch you checked, so it is optimistically
          biased and should not be reported as your model&rsquo;s performance.
        </Callout>

        <h2>Practical notes</h2>
        <ul>
          <li>
            <strong>Patience beats a fixed budget.</strong> Validation curves are noisy and often non-monotone;
            stopping at the first uptick stops too early. Wait <M>p</M> evaluations without improvement, then
            restore the best checkpoint — restoring matters, since the final weights are not the best ones.
          </li>
          <li>
            <strong>It composes with other regularizers, and that&rsquo;s a trap.</strong> Early stopping plus
            weight decay plus dropout are three dials on one quantity. Tuning them independently can leave you far
            from where you meant to be — the joint-tuning point from the previous page, again.
          </li>
          <li>
            <strong>It is nearly free, which is its real advantage.</strong> Tuning <M>{String.raw`\lambda`}</M>{" "}
            means a full retrain per value; early stopping evaluates every level of its structure in{" "}
            <em>one</em> training run, since every epoch is a candidate. That is an unusually good deal, and the
            main reason it is ubiquitous.
          </li>
          <li>
            <strong>It is how boosting is controlled too.</strong> Rounds play the role of epochs; the{" "}
            <Link href="/learn/boosting/early-stopping" style={link}>boosting track</Link> has the measured
            version, and{" "}
            <Link href="/learn/learning-theory/boosting-and-margins" style={link}>the margin story</Link> explains
            why the curve is often flatter there than you would expect.
          </li>
        </ul>

        <PrevNext
          prev={{ href: "/learn/model-selection/regularization-as-capacity", label: <>← Regularization as capacity control</> }}
          next={{ href: "/learn/model-selection/information-criteria", label: <>Next up · AIC, BIC &amp; MDL →</> }}
        />
      </div>
    </article>
  );
}
