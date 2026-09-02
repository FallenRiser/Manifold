import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The effect on the loss landscape — Manifold",
  description:
    "Geometrically, L2 adds a quadratic bowl centred at the origin to the loss surface: it lifts high-norm solutions, adds 2λI to the Hessian to raise every eigenvalue and improve conditioning, and among all fits it selects the smallest-norm one. Why that helps the smooth regression but not the memorising classifier.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LandscapeEffectPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Weight decay", color: CORAL }, { label: "Tier 3 · theory", color: CORAL }]}
        time="about 7 minutes"
        title={<>The effect on the loss landscape</>}
        intro={<>Everything so far has described weight decay through its update rule. Here is the same
          thing seen from above, as a change to the shape of the loss surface the optimiser is walking
          on. That geometric view — a quadratic bowl added to the landscape, a uniform lift to the
          Hessian&rsquo;s eigenvalues, a selection of the smallest-norm fit — is what finally explains
          why the same penalty rescues the smooth regression and does nothing for the memorising
          classifier.</>}
      />

      <div className="lesson">
        <h2>A quadratic bowl added to the surface</h2>
        <p>
          The penalty <M>{String.raw`\lambda \lVert \mathbf{w} \rVert^2`}</M> is, as a function of the
          weights, a perfect paraboloid — a bowl centred at the origin, rising in every direction. Adding
          it to the data loss superimposes that bowl on whatever surface the data defined:
        </p>

        <MathBlock>{String.raw`\mathcal{L}_{\text{reg}}(\mathbf{w}) = \mathcal{L}_{\text{data}}(\mathbf{w}) + \lambda \lVert \mathbf{w} \rVert^2`}</MathBlock>

        <p>
          The consequence is entirely geometric. Solutions far from the origin — high-norm weight
          vectors — are <strong>lifted</strong>: the bowl adds <M>{String.raw`\lambda \lVert \mathbf{w} \rVert^2`}</M>
          to their loss, and that penalty grows with the square of the distance. Solutions near the
          origin are barely touched. So the minimum of the combined surface is dragged <em>inward</em>,
          toward zero, by an amount that depends on how much the data loss resists the pull in each
          direction. Where the data loss is steep, the minimum barely moves; where it is flat, the bowl
          wins and the minimum slides a long way toward the origin.
        </p>

        <h2>The Hessian: every eigenvalue lifted by 2λ</h2>
        <p>
          Make that precise through curvature. The Hessian of the penalty is constant:{" "}
          <M>{String.raw`\nabla^2 (\lambda \lVert \mathbf{w} \rVert^2) = 2\lambda \mathbf{I}`}</M>. So the
          Hessian of the regularised loss is the data Hessian plus a scaled identity,
        </p>

        <MathBlock>{String.raw`\mathbf{H}_{\text{reg}} = \mathbf{H}_{\text{data}} + 2\lambda \mathbf{I}.`}</MathBlock>

        <p>
          Adding <M>{String.raw`2\lambda \mathbf{I}`}</M> raises <em>every</em> eigenvalue of the Hessian
          by exactly <M>{String.raw`2\lambda`}</M>: if <M>{String.raw`\mathbf{H}_{\text{data}}`}</M> has
          eigenvalues <M>{String.raw`\mu_1 \ge \cdots \ge \mu_d`}</M>, then{" "}
          <M>{String.raw`\mathbf{H}_{\text{reg}}`}</M> has eigenvalues{" "}
          <M>{String.raw`\mu_i + 2\lambda`}</M> along the same eigenvectors. Two things follow. First,
          the <strong>conditioning improves</strong>: the condition number{" "}
          <M>{String.raw`(\mu_1 + 2\lambda)/(\mu_d + 2\lambda)`}</M> is closer to one than{" "}
          <M>{String.raw`\mu_1/\mu_d`}</M>, which is why weight decay tends to make optimisation
          better-behaved as a side effect. Second, the <strong>flattest directions lose their
          freedom</strong>. A direction with <M>{String.raw`\mu_i \approx 0`}</M> was one the data barely
          constrained — the weights could drift along it for free. After the lift it has curvature{" "}
          <M>{String.raw`2\lambda`}</M>, so drifting now costs loss, and the optimiser pins those
          directions near zero. Weight decay does its strongest work exactly where the data said the
          least.
        </p>

        <h2>Among all fits, it selects the smallest norm</h2>
        <p>
          Now push to the overparameterised regime this track lives in, where many weight vectors fit the
          training data equally well — a whole flat valley of zero-loss solutions. On that valley the data
          loss is constant, so the only term that distinguishes one solution from another is the penalty{" "}
          <M>{String.raw`\lambda \lVert \mathbf{w} \rVert^2`}</M>. The regularised optimum is therefore the{" "}
          <strong>minimum-norm solution</strong> among all the perfect fits: of every set of weights that
          interpolates the data, weight decay picks the one closest to the origin.
        </p>
        <p>
          This connects directly to margin. For a linear classifier the minimum-norm separating
          hyperplane is the <strong>maximum-margin</strong> one — the same solution an SVM finds — because
          shrinking the weight norm while keeping the data correctly classified is exactly what widens the
          margin. So weight decay is not only shrinking numbers; among equally-good fits it is expressing a
          preference for the flattest, widest-margin, smallest-norm one, which is the fit most likely to
          generalise.
        </p>

        <h2>Why this rescues one problem and not the other</h2>
        <p>
          The geometry now explains the split result of the whole chapter. For the{" "}
          <Link href="/learn/nn-regularisation/l2-penalty" style={link}>smooth regression</Link>, small
          norm <em>means</em> smooth: the target is a gentle curve, its natural fit has modest weights,
          and the noisy overfit is exactly the large-norm, high-curvature solution the bowl lifts and
          discards. Selecting the smallest-norm fit selects the smooth one, so test error falls all the
          way out to strong decay.
        </p>
        <p>
          The <Link href="/learn/nn-regularisation/how-much-decay" style={link}>memorising classifier</Link>{" "}
          is the opposite case. It already interpolates its 250 points at <em>small</em> norm — the
          minimum-norm fit is still a memorising fit, because the network memorises through the number of
          units, not the size of any weight. Weight decay dutifully selects the smallest-norm solution,
          but the smallest-norm solution here still fits the label noise. The bowl is added, the
          eigenvalues are lifted, the minimum-norm fit is chosen — and none of it removes the capacity
          that is actually causing the overfitting. The lever is real; it is just not attached to this
          particular problem&rsquo;s failure.
        </p>

        <Callout color={CORAL} title={<>Weight decay biases toward small norm — useful only when small norm means simple</>}>
          The single sentence to carry out of this chapter: weight decay reshapes the loss landscape to
          favour small-norm solutions, and that is a good bias precisely when small norm coincides with
          the simple, generalising fit. On smooth-target problems it does — small weights are smooth
          functions — and weight decay is a clean win. On a network that memorises at small norm it does
          not, and no amount of decay will help. Knowing which world you are in is the difference between
          using the tool and cargo-culting it.
        </Callout>

        <Proof color={CORAL} title="the ridge-shrinkage formula: where L2 moves the optimum">
          <p>
            Take a quadratic model of the data loss around its unregularised minimiser{" "}
            <M>{String.raw`\mathbf{w}^\star`}</M>:
          </p>
          <MathBlock>{String.raw`\mathcal{L}_{\text{data}}(\mathbf{w}) = \tfrac{1}{2}(\mathbf{w} - \mathbf{w}^\star)^\top \mathbf{H}\,(\mathbf{w} - \mathbf{w}^\star) + \text{const},`}</MathBlock>
          <p>
            with <M>{String.raw`\mathbf{H} = \mathbf{H}_{\text{data}} \succeq 0`}</M>. The regularised
            objective adds <M>{String.raw`\lambda \lVert \mathbf{w} \rVert^2`}</M>. Setting its gradient to
            zero,
          </p>
          <MathBlock>{String.raw`\mathbf{H}(\mathbf{w} - \mathbf{w}^\star) + 2\lambda \mathbf{w} = \mathbf{0} \;\;\Longrightarrow\;\; \mathbf{w}_\lambda = (\mathbf{H} + 2\lambda \mathbf{I})^{-1}\mathbf{H}\,\mathbf{w}^\star.`}</MathBlock>
          <p>
            Diagonalise <M>{String.raw`\mathbf{H} = \mathbf{Q}\,\mathrm{diag}(\mu_i)\,\mathbf{Q}^\top`}</M>.
            In the eigenbasis, each coordinate of the optimum is shrunk independently:
          </p>
          <MathBlock>{String.raw`(\mathbf{Q}^\top \mathbf{w}_\lambda)_i = \frac{\mu_i}{\mu_i + 2\lambda}\,(\mathbf{Q}^\top \mathbf{w}^\star)_i.`}</MathBlock>
          <p>
            The shrink factor <M>{String.raw`\mu_i/(\mu_i + 2\lambda)`}</M> reads off the whole story.
            Along a <strong>stiff</strong> direction (<M>{String.raw`\mu_i \gg 2\lambda`}</M>) the factor
            is near one and the coordinate is left almost untouched — the data pinned it down, so decay
            defers. Along a <strong>flat</strong> direction (<M>{String.raw`\mu_i \ll 2\lambda`}</M>) the
            factor is near zero and the coordinate is pulled sharply toward the origin — the data said
            nothing, so decay decides. This is the classical ridge-regression estimator, and it is the
            exact mechanism by which L2 discards the high-variance, poorly-determined directions of the
            fit while preserving the well-determined ones. As <M>{String.raw`\lambda \to \infty`}</M> every
            coordinate is driven to zero; as <M>{String.raw`\lambda \to 0`}</M> you recover{" "}
            <M>{String.raw`\mathbf{w}^\star`}</M> exactly.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What does adding an L2 penalty do to the Hessian of the loss?</>,
              options: [
                "It leaves the Hessian unchanged and only shifts the gradient",
                "It adds 2λI, raising every eigenvalue by 2λ along the same eigenvectors — improving conditioning and giving the flattest directions curvature they lacked",
                "It multiplies every eigenvalue by 2λ",
              ],
              answer: 1,
              explain: <>The penalty&rsquo;s Hessian is the constant <M>{String.raw`2\lambda\mathbf{I}`}</M>,
                so <M>{String.raw`\mathbf{H}_{\text{reg}} = \mathbf{H}_{\text{data}} + 2\lambda\mathbf{I}`}</M>.
                Every eigenvalue rises by <M>{String.raw`2\lambda`}</M>, which pulls the condition number
                toward one and turns previously-free flat directions into ones that cost loss to move
                along.</>,
            },
            {
              q: <>Among many weight vectors that all fit the training data perfectly, which one does L2
                select, and what is that connected to?</>,
              options: [
                "The largest-norm solution, which maximises capacity",
                "The smallest-norm solution — on the flat valley of perfect fits the data loss is constant, so only the penalty distinguishes them; for a linear classifier this is the maximum-margin fit",
                "A random solution, since the penalty is constant on the valley",
              ],
              answer: 1,
              explain: <>On the set of perfect fits the data loss is constant, so the penalty{" "}
                <M>{String.raw`\lambda\lVert\mathbf{w}\rVert^2`}</M> is the only tie-breaker and it picks
                the minimum-norm fit. For a linear separator the minimum-norm separating hyperplane is
                exactly the maximum-margin one.</>,
            },
            {
              q: <>Why does selecting the smallest-norm fit rescue the smooth regression but not the
                memorising classifier?</>,
              options: [
                "The classifier has more parameters, so the penalty is diluted",
                "For the smooth target, small norm means a smooth function, so the min-norm fit is the good one; the classifier already memorises its points at small norm, so the min-norm fit still fits the noise",
                "The regression uses AdamW and the classifier uses SGD, which is the only difference",
              ],
              answer: 1,
              explain: <>Weight decay biases toward small norm. That helps only when small norm coincides
                with the simple, generalising fit. The smooth target&rsquo;s natural fit has small weights;
                the classifier memorises through many small-weight units, so its minimum-norm solution is
                still a memorising one and decay cannot remove that capacity.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/how-much-decay", label: <>&#8592; How much decay</> }}
          next={{ href: "/learn/nn-regularisation/randomly-removing-units", label: <>Next up &middot; Randomly removing units &#8594;</> }}
        />
      </div>
    </article>
  );
}
