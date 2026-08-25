import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Constrained optimization & Lagrange multipliers — Manifold",
  description:
    "Most real objectives come with constraints — a budget, a unit-length requirement, a margin. Lagrange multipliers turn a constrained problem into an unconstrained one, and they're the trick behind PCA, SVMs, and ridge regression.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LagrangePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Calculus & optimization", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Constrained optimization &amp; Lagrange multipliers</>}
        intro={<>&ldquo;Minimize this, <em>subject to</em> that&rdquo; is the shape of a huge fraction of ML problems.
          Lagrange multipliers are the elegant device that folds the constraint into the objective, and they explain
          why PCA lands on an eigenvector and why an SVM has support vectors.</>}
      />

      <div className="lesson">
        <h2>The geometric idea</h2>
        <p>
          Suppose you want to maximize <M>{String.raw`f(\mathbf x)`}</M> but you&rsquo;re confined to a constraint
          curve <M>{String.raw`g(\mathbf x) = 0`}</M>. Walk along the constraint: as long as <M>f</M> is still
          increasing in some allowed direction, you&rsquo;re not at the top. You stop exactly when moving along the
          constraint no longer changes <M>f</M> — which happens when the two gradients are <strong>parallel</strong>:
        </p>
        <MathBlock>{String.raw`\nabla f = \lambda\,\nabla g.`}</MathBlock>
        <p>
          The scalar <M>{String.raw`\lambda`}</M> is the <strong>Lagrange multiplier</strong>. Geometrically, the
          level curve of <M>f</M> is tangent to the constraint at the optimum — they just kiss. Introduce the{" "}
          <strong>Lagrangian</strong>
        </p>
        <MathBlock>{String.raw`\mathcal L(\mathbf x, \lambda) = f(\mathbf x) - \lambda\,g(\mathbf x),`}</MathBlock>
        <p>
          and setting <M>{String.raw`\nabla \mathcal L = 0`}</M> recovers both the parallel-gradient condition and the
          constraint itself. A constrained problem in <M>{String.raw`\mathbf x`}</M> becomes an unconstrained one in{" "}
          <M>{String.raw`(\mathbf x, \lambda)`}</M>.
        </p>

        <h2>What the multiplier means</h2>
        <p>
          <M>{String.raw`\lambda`}</M> isn&rsquo;t just bookkeeping — it&rsquo;s the <strong>shadow price</strong> of
          the constraint: how much the optimal value would improve if you loosened the constraint by one unit. A large{" "}
          <M>{String.raw`\lambda`}</M> means the constraint is really binding you; <M>{String.raw`\lambda = 0`}</M>
          means it isn&rsquo;t active at all. This economic reading is why multipliers appear all over resource
          allocation and, in ML, in the regularization/constraint duality.
        </p>

        <h2>Where it drives the algorithms</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>PCA.</strong> Maximize variance <M>{String.raw`\mathbf v^\top\Sigma\mathbf v`}</M> subject to <M>{String.raw`\lVert\mathbf v\rVert = 1`}</M>. The Lagrangian&rsquo;s stationarity condition <em>is</em> the eigenvalue equation <M>{String.raw`\Sigma\mathbf v = \lambda\mathbf v`}</M> — the multiplier turns out to be the eigenvalue. (Full derivation on the <Link href="/learn/pca/rayleigh-and-eigen" style={link}>Rayleigh page</Link>.)</li>
          <li><strong>SVMs.</strong> Maximize the margin subject to every point being classified correctly. The multipliers pick out the <em>support vectors</em> — the few points where the constraint is active.</li>
          <li><strong>Ridge / lasso.</strong> &ldquo;Minimize error subject to <M>{String.raw`\lVert\mathbf w\rVert \le t`}</M>&rdquo; and &ldquo;minimize error <M>{String.raw`+\,\lambda\lVert\mathbf w\rVert`}</M>&rdquo; are two faces of the same Lagrangian — the <Link href="/learn/regularized-regression" style={link}>constraint/penalty duality</Link>.</li>
        </ul>

        <p>
          Inequality constraints (<M>{String.raw`g(\mathbf x)\le 0`}</M>) generalise this through the{" "}
          <strong>KKT conditions</strong>, which add the rule that either the constraint is tight or its multiplier is
          zero — the exact mechanism that makes most SVM multipliers vanish and leaves only support vectors. That
          generalisation leads straight into <Link href="/learn/math-foundations/duality" style={link}>duality</Link>.
        </p>

        <Callout color={AMBER} title={<>The pattern to remember</>}>
          A constraint is satisfied at an optimum when you can&rsquo;t improve the objective without violating it — and
          that&rsquo;s exactly when the gradients line up. Lagrange multipliers turn that geometric fact into algebra
          you can solve, converting &ldquo;optimize with strings attached&rdquo; into ordinary calculus.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/gradient-descent", label: <>← Gradient descent</> }}
          next={{ href: "/learn/math-foundations/duality", label: <>Next up · Duality, in one page →</> }}
        />
      </div>
    </article>
  );
}
