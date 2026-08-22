import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Boosting as functional gradient descent — Manifold",
  description:
    "The unifying theory: boosting is gradient descent where the variable is a function, not a vector. Seeing the loss functional, its gradient in function space, and the weak learner as a projected step reveals why one framework spans AdaBoost, GBM, and everything after.",
};

const TREES = "var(--c-trees)";

export default function FunctionalGradientPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Boosting as functional gradient descent</>}
        intro={<>
          Every method in this track is one algorithm wearing different clothes. This page states that algorithm
          in its most general form — Mason, Baxter, Bartlett &amp; Frean&rsquo;s <em>gradient descent in function
          space</em> — so that AdaBoost, gradient boosting, and the modern boosters become instances of a single
          idea.
        </>}
      />

      <div className="lesson">
        <h2>The object being optimised is a function</h2>
        <p>
          Ordinary learning fixes a model class and optimises its parameters <M>{String.raw`\theta \in \mathbb{R}^p`}</M>.
          Boosting is bolder: it optimises directly over <strong>functions</strong> <M>{String.raw`F`}</M>,
          searching a vast space (all sums of trees) for the one that minimises the expected loss{" "}
          <em>functional</em>:
        </p>
        <MathBlock>{String.raw`\mathcal{L}[F] = \mathbb{E}_{x,y}\big[\,L(y, F(x))\,\big]`}</MathBlock>
        <p>
          We cannot parameterise <M>{String.raw`F`}</M> by a finite vector, so we cannot run ordinary gradient
          descent. But we <em>can</em> define a gradient of a functional and step along it.
        </p>

        <h2>The gradient in function space</h2>
        <p>
          Treat <M>{String.raw`F`}</M> as a very long vector — one coordinate per possible input{" "}
          <M>{String.raw`x`}</M>, namely the value <M>{String.raw`F(x)`}</M>. The gradient of{" "}
          <M>{String.raw`\mathcal{L}`}</M> in this space is the function whose value at each point is the
          pointwise derivative of the loss:
        </p>
        <MathBlock>{String.raw`\big(\nabla \mathcal{L}[F]\big)(x) = \frac{\partial\, L(y, F(x))}{\partial\, F(x)}`}</MathBlock>
        <p>
          Steepest descent says: move <M>{String.raw`F`}</M> in the direction <M>{String.raw`-\nabla\mathcal{L}[F]`}</M>.
          At the training points that is exactly the <strong>negative-gradient vector</strong>{" "}
          <M>{String.raw`-g_i`}</M> — the pseudo-residuals from the{" "}
          <Link href="/learn/boosting/gradient-boosting" style={link}>gradient-boosting page</Link>. So far this is
          just the earlier idea, stated in the language of functionals.
        </p>

        <h2>The projection step: why we need a weak learner</h2>
        <p>
          Here is the one genuinely new subtlety. The ideal step <M>{String.raw`-g_i`}</M> is defined only at the{" "}
          <em> training points</em> — it is a list of numbers, not a function. To move in function space we must
          take a <em>step that is itself a member of our model class</em> (a tree). So we find the weak learner{" "}
          <M>{String.raw`h_m`}</M> that best <strong>approximates</strong> the negative gradient — the projection
          of the ideal step onto the space of trees:
        </p>
        <MathBlock>{String.raw`h_m = \arg\min_{h \in \mathcal{H}} \sum_i \big(-g_i - h(x_i)\big)^2`}</MathBlock>
        <p>
          — a least-squares fit of a tree to the pseudo-residuals. Then a line search picks the step length{" "}
          <M>{String.raw`\rho_m`}</M>, and we update <M>{String.raw`F_m = F_{m-1} + \nu\rho_m h_m`}</M>. Boosting
          is <strong>steepest descent, but each step is snapped to the nearest direction our weak learner can
          actually represent.</strong> That projection is why the base learners must be expressive enough to
          follow the gradient, yet weak enough not to overshoot — the whole tension of the method in one line.
        </p>

        <Callout color={TREES} title={<>The framework in one table</>}>
          <table style={tbl}>
            <thead><tr><th style={th}>Choose this loss <M>{String.raw`L`}</M></th><th style={th}>…and you get</th></tr></thead>
            <tbody>
              <tr><td style={td}>Exponential <M>{String.raw`e^{-yF}`}</M></td><td style={td}>AdaBoost</td></tr>
              <tr><td style={td}>Logistic / deviance</td><td style={td}>LogitBoost / GBM classifier</td></tr>
              <tr><td style={td}>Squared error</td><td style={td}>Least-squares boosting (residual fitting)</td></tr>
              <tr><td style={td}>Absolute / Huber / pinball</td><td style={td}>Robust &amp; quantile boosting</td></tr>
              <tr><td style={td}>Any twice-differentiable <M>{String.raw`L`}</M> (2nd order)</td><td style={td}>XGBoost&rsquo;s Newton boosting</td></tr>
            </tbody>
          </table>
          One optimiser — functional gradient (or Newton) descent — and a menu of losses. That is the entire
          design space of boosting.
        </Callout>

        <h2>Why this view is worth the abstraction</h2>
        <p>
          It tells you how to invent a boosting method for a <em>new</em> problem: write down a differentiable
          loss for your task — a ranking loss, a survival loss, a custom business cost — supply its gradient (and
          Hessian, for the <Link href="/learn/boosting/newton-boosting" style={link}>Newton version</Link>), and
          the same machine trains it. This is exactly how <code>LambdaMART</code> (boosting for ranking) and
          survival-boosting were built, and why every serious booster lets you pass a custom objective. The
          framework is not decoration; it is a recipe for extension.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/tuning", label: <>← Choosing &amp; tuning a booster</> }}
          next={{ href: "/learn/boosting/bias-variance", label: <>Next up · Bias, variance &amp; why it isn&rsquo;t bagging →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const tbl: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13.5, margin: "4px 0 2px" };
const th: React.CSSProperties = { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border-strong)", color: "var(--ink)", fontWeight: 600 };
const td: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--muted)" };
