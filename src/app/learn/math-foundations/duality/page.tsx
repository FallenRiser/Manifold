import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Duality, in one page — Manifold",
  description:
    "Every optimization problem has a shadow twin — its dual — that lower-bounds it, and often is easier to solve. Duality is why SVMs kernelize and why the constraint and penalty forms of regularization coincide.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DualityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Calculus & optimization", color: AMBER }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Duality, in one page</>}
        intro={<>Every constrained optimization problem casts a shadow — a second problem, the <em>dual</em>, built
          from the Lagrange multipliers. The dual bounds the original from the other side, and is sometimes far easier
          to solve. It&rsquo;s the machinery that lets SVMs use the kernel trick.</>}
      />

      <div className="lesson">
        <h2>Primal and dual</h2>
        <p>
          Start from the <Link href="/learn/math-foundations/lagrange-multipliers" style={link}>Lagrangian</Link>{" "}
          <M>{String.raw`\mathcal L(\mathbf x, \lambda)`}</M>. The original (<strong>primal</strong>) problem minimizes
          over <M>{String.raw`\mathbf x`}</M>. The <strong>dual</strong> flips the order: first minimize the Lagrangian
          over <M>{String.raw`\mathbf x`}</M> to get a function of the multipliers alone, then maximize <em>that</em>
          over the multipliers:
        </p>
        <MathBlock>{String.raw`g(\lambda) = \min_{\mathbf x}\, \mathcal L(\mathbf x, \lambda), \qquad \text{dual: } \max_{\lambda \ge 0}\, g(\lambda).`}</MathBlock>

        <h2>Weak and strong duality</h2>
        <p>
          <strong>Weak duality</strong> always holds: the dual&rsquo;s best value never exceeds the primal&rsquo;s —
          the dual gives a guaranteed <em>lower bound</em> on the answer. When the problem is nicely convex,{" "}
          <strong>strong duality</strong> holds and the two values are <em>equal</em>: solving the dual solves the
          primal exactly. The gap between them (zero, under convexity) is the <em>duality gap</em>, and it&rsquo;s a
          built-in certificate of optimality — a way to know you&rsquo;ve actually reached the best answer.
        </p>

        <h2>Why ML leans on it</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>The kernel trick.</strong> The dual of an SVM depends on the data only through <em>dot products</em> between examples. Swap each dot product for a <Link href="/learn/kernel-ridge-regression" style={link}>kernel</Link> and you get a nonlinear classifier for free — impossible to see in the primal.</li>
          <li><strong>Sparsity of support vectors.</strong> The dual variables are the multipliers; most are zero (inactive constraints), leaving only the support vectors — a direct read-off from duality.</li>
          <li><strong>Constraint ⇄ penalty.</strong> Ridge&rsquo;s &ldquo;minimize error subject to <M>{String.raw`\lVert\mathbf w\rVert\le t`}</M>&rdquo; and &ldquo;minimize error <M>{String.raw`+\lambda\lVert\mathbf w\rVert^2`}</M>&rdquo; are a primal/dual pair — same solution path, indexed by <M>t</M> or <M>{String.raw`\lambda`}</M>.</li>
        </ul>

        <Callout color={AMBER} title={<>The one idea to keep</>}>
          Duality says a hard problem often has an easier twin that touches it exactly (under convexity). Solve
          whichever side is simpler, and read the other off the multipliers. It&rsquo;s an advanced tool — you can use
          SVMs and ridge without it — but it&rsquo;s <em>why</em> those methods take the shape they do.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/lagrange-multipliers", label: <>← Constrained optimization &amp; Lagrange multipliers</> }}
          next={{ href: "/learn/math-foundations/subgradients", label: <>Next up · Subgradients &amp; non-smooth objectives →</> }}
        />
      </div>
    </article>
  );
}
