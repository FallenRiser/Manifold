import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Boosting as gradient descent — Manifold",
  description:
    "Friedman's reframing that unlocked modern machine learning: a boosting round is one step of gradient descent, taken in the space of functions. Fit each new tree to the negative gradient of the loss — the pseudo-residuals — and boosting works for any differentiable loss you like.",
};

const TREES = "var(--c-trees)";

export default function GradientBoostingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 1 · intuition", color: "var(--c-fundamentals)" }]}
        time="about 10 minutes"
        title={<>Boosting as gradient descent</>}
        intro={<>
          AdaBoost was tied to one loss. Jerome Friedman&rsquo;s 1999 insight freed it: a boosting round is
          nothing but a step of <strong>gradient descent, performed in function space</strong>. Once you see it,
          boosting works for any differentiable loss — regression, classification, ranking, survival — all from
          one template. This is the single most important page in the track.
        </>}
      />

      <div className="lesson">
        <h2>Ordinary gradient descent, one level up</h2>
        <p>
          You know gradient descent on <em>parameters</em>: to minimise a loss, compute its gradient with respect
          to the weights and step downhill, <M>{String.raw`\theta \leftarrow \theta - \nu\, \nabla_\theta L`}</M>.
          Boosting does the same thing, but the object we&rsquo;re optimising is not a vector of weights — it is
          the <strong>function <M>{String.raw`F`}</M> itself</strong>. We want to find the function that minimises
          the total loss <M>{String.raw`\sum_i L(y_i, F(x_i))`}</M>, and we&rsquo;ll get there by taking steps in
          the space of functions.
        </p>
        <p>
          What is the gradient with respect to a <em>function</em>? Evaluated at the training points, it is just
          the vector of partial derivatives of the loss at each prediction:
        </p>
        <MathBlock>{String.raw`g_i = \left.\frac{\partial\, L(y_i, F(x_i))}{\partial\, F(x_i)}\right|_{F=F_{m-1}}`}</MathBlock>
        <p>
          The steepest-descent direction is <M>{String.raw`-g_i`}</M> at each point. If we could, we&rsquo;d
          update <M>{String.raw`F(x_i) \leftarrow F(x_i) - \nu\, g_i`}</M> — but that only tells us how to change
          the prediction at the <em>training</em> points. To generalise to new <M>{String.raw`x`}</M>, we need a
          function that <strong>approximates</strong> the negative-gradient vector everywhere. That approximator
          is the next tree.
        </p>

        <Callout color={TREES} title={<>The one idea to remember</>}>
          <strong>Fit each new weak learner to the negative gradient of the loss.</strong> The negative gradients
          — called the <em>pseudo-residuals</em> — are the direction that most rapidly reduces the loss. A tree
          that predicts them is a functional step downhill. Add a small multiple of it and repeat.
        </Callout>

        <h2>Squared error makes it obvious: gradients are residuals</h2>
        <p>
          Take the everyday loss <M>{String.raw`L(y,F) = \tfrac12 (y - F)^2`}</M>. Its gradient with respect to{" "}
          <M>{String.raw`F`}</M> is
        </p>
        <MathBlock>{String.raw`\frac{\partial}{\partial F}\,\tfrac12 (y-F)^2 = -(y - F) \quad\Rightarrow\quad -g_i = y_i - F_{m-1}(x_i)`}</MathBlock>
        <p>
          The negative gradient is <strong>literally the residual</strong> — how far the current model is from the
          truth. So for squared error, gradient boosting reduces to something you could have guessed with no
          calculus at all: <em>fit the next tree to the errors the model is still making, then add it in.</em> The
          gradient view&rsquo;s power is that it says exactly what &ldquo;the errors&rdquo; means for{" "}
          <em>every other</em> loss too — replace &ldquo;residual&rdquo; with &ldquo;negative gradient&rdquo; and
          the same algorithm handles log-loss, absolute error, Huber, and more.
        </p>

        <h2>The gradient boosting algorithm</h2>
        <p>Friedman&rsquo;s <em>gradient boosting machine</em>, in full:</p>
        <ol style={ol}>
          <li>
            <strong>Initialise</strong> with the best constant: <M>{String.raw`F_0(x) = \arg\min_c \sum_i L(y_i, c)`}</M>
            {" "}(the mean for squared error, the log-odds for log-loss).
          </li>
          <li>
            <strong>For <M>{String.raw`m = 1 \dots M`}</M>:</strong>
            <ul style={ul}>
              <li>Compute pseudo-residuals <M>{String.raw`r_{im} = -\,g_i = -\big[\partial L(y_i,F(x_i))/\partial F\big]_{F_{m-1}}`}</M>.</li>
              <li>Fit a regression tree <M>{String.raw`h_m`}</M> to the targets <M>{String.raw`r_{im}`}</M>.</li>
              <li>Set each leaf&rsquo;s value by a <strong>line search</strong>: the constant that minimises the true loss for the examples in that leaf (for squared error this is just their mean residual).</li>
              <li>Update <M>{String.raw`F_m(x) = F_{m-1}(x) + \nu\, h_m(x)`}</M>, with learning rate <M>{String.raw`\nu`}</M>.</li>
            </ul>
          </li>
        </ol>
        <p>
          Note the division of labour: the tree is <em>always</em> a plain regression tree fit by squared error
          on the pseudo-residuals (that&rsquo;s what makes it fast and generic), while the{" "}
          <strong>loss</strong> enters in only two places — how the pseudo-residuals are computed and how the leaf
          values are set. Swap the loss, keep the machine.
        </p>

        <Callout color={TREES} title={<>Why regression trees, even for classification?</>}>
          This surprises everyone at first: a gradient-boosted <em>classifier</em> is built from regression
          trees. The reason is that boosting never asks a tree to predict a class — it asks it to predict a{" "}
          <strong>real-valued gradient</strong>. The classification enters through the log-loss and a final
          softmax over the accumulated real-valued scores. The trees only ever do regression on gradients.
        </Callout>

        <Quiz
          title="Can you answer these?"
          accent={TREES}
          questions={[
            {
              q: <>In gradient boosting, what target is each new tree actually fit to?</>,
              options: [
                "The original labels y",
                "The negative gradient of the loss at the current predictions (the pseudo-residuals)",
                "The residuals of the very first tree only",
              ],
              answer: 1,
              explain: <>Each tree approximates the negative-gradient vector — the steepest-descent direction in function space — evaluated at the current ensemble's predictions.</>,
            },
            {
              q: <>For the squared-error loss ½(y−F)², what does the negative gradient equal?</>,
              options: ["The label y", "The residual y − F", "The squared residual"],
              answer: 1,
              explain: <>∂/∂F of ½(y−F)² is −(y−F), so the negative gradient is exactly the residual. Squared-error gradient boosting = fitting trees to residuals.</>,
            },
            {
              q: <>How does gradient boosting adapt from regression to a different loss, say log-loss?</>,
              options: [
                "It swaps the regression trees for classification trees",
                "It changes only how pseudo-residuals and leaf values are computed; the trees stay plain regression trees",
                "It requires a completely different algorithm",
              ],
              answer: 1,
              explain: <>The machine is loss-agnostic. Only the gradient (pseudo-residuals) and the leaf line-search depend on the loss; the tree fitting is always squared-error regression on those gradients.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/boosting/multiclass", label: <>← Multiclass &amp; real-valued boosting</> }}
          next={{ href: "/learn/boosting/gbm-regression", label: <>Next up · Gradient boosting for regression →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.9 };
const ul: React.CSSProperties = { margin: "6px 0 10px", paddingLeft: "1.3em", fontSize: 14.5, color: "var(--muted)", lineHeight: 1.75 };
