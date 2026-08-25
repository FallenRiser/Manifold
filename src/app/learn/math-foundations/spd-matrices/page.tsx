import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { CovarianceEllipseLab } from "@/components/labs/CovarianceEllipseLab";

export const metadata = {
  title: "Symmetric positive-definite matrices — Manifold",
  description:
    "Covariance matrices, kernel matrices, and Hessians of convex losses are all symmetric positive-(semi)definite. This special class has all-real, non-negative eigenvalues and defines the bowl-shaped quadratics optimization loves.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SpdPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Linear algebra", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Symmetric positive-definite matrices</>}
        intro={<>One special family of matrices keeps reappearing across machine learning: covariance matrices, kernel
          (Gram) matrices, and the Hessians of convex losses. They&rsquo;re all <em>symmetric positive
          semidefinite</em>, and that structure is exactly what makes PCA clean and convex optimization work.</>}
      />

      <div className="lesson">
        <h2>Symmetric first</h2>
        <p>
          A matrix is <strong>symmetric</strong> if <M>{String.raw`A = A^\top`}</M> — it equals its own transpose. The{" "}
          <strong>spectral theorem</strong> hands symmetric matrices two gifts: all their eigenvalues are <em>real</em>,
          and their eigenvectors are mutually <em>orthogonal</em>. That&rsquo;s precisely why{" "}
          <Link href="/learn/pca/eigenvectors" style={link}>PCA&rsquo;s components</Link> come out perpendicular with
          real variances — the covariance matrix is symmetric by construction.
        </p>

        <h2>Positive definite: the bowl condition</h2>
        <p>
          A symmetric matrix is <strong>positive definite (SPD)</strong> if the quadratic form{" "}
          <M>{String.raw`\mathbf x^\top A\,\mathbf x > 0`}</M> for every nonzero <M>{String.raw`\mathbf x`}</M>
          (and <strong>positive semidefinite (PSD)</strong> if <M>{String.raw`\ge 0`}</M>). Equivalently — and more
          usefully — <strong>all its eigenvalues are positive</strong> (non-negative for PSD):
        </p>
        <MathBlock>{String.raw`A \text{ is SPD} \iff A = A^\top \text{ and } \lambda_i > 0 \text{ for all } i.`}</MathBlock>
        <p>
          Geometrically, <M>{String.raw`\mathbf x^\top A\,\mathbf x`}</M> is a bowl that opens upward in every
          direction — no saddle, no downhill escape. The <Link href="/learn/pca/centering-and-covariance" style={link}>covariance
          ellipse</Link> is the level set of exactly such a form; drag its knobs and watch the two eigenvalues (the
          axis variances) stay non-negative no matter what:
        </p>

        <LabFrame
          accent={AMBER}
          tryThis={<>Push the correlation to the extremes. Can you make either eigenvalue <M>{String.raw`\lambda`}</M>
            go negative? What happens to the ellipse as one approaches zero?</>}
          insight={<>You can drive an eigenvalue to zero (the ellipse collapses to a line — positive <em>semi</em>definite,
            singular) but never negative. A covariance matrix is always PSD: variance in any direction can&rsquo;t be
            negative. That&rsquo;s the SPD condition, made visible.</>}
        >
          <CovarianceEllipseLab />
        </LabFrame>

        <h2>Why ML cares</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Covariance matrices</strong> are PSD — variance is never negative — which is what lets PCA eigen-decompose them safely.</li>
          <li><strong>Kernel (Gram) matrices</strong> must be PSD to be valid; it&rsquo;s the defining condition of a kernel behind <Link href="/learn/kernel-ridge-regression" style={link}>kernel methods</Link> and SVMs.</li>
          <li><strong>A convex loss has a PSD Hessian.</strong> Positive-definite curvature everywhere means one global minimum and no saddles — exactly the <Link href="/learn/math-foundations/convexity" style={link}>convexity</Link> that makes gradient descent reliable.</li>
        </ul>

        <Callout color={AMBER} title={<>The link across the whole strand</>}>
          SPD matrices are where linear algebra meets optimization: the same &ldquo;bowl opening upward&rdquo; that
          makes <M>{String.raw`\mathbf x^\top A\mathbf x`}</M> positive is the shape of a convex loss surface. That
          bridge — matrices describing curvature — is why the next strand, calculus and optimization, follows this one.
        </Callout>

        <Quiz
          title="Checkpoint · linear algebra"
          accent={AMBER}
          questions={[
            {
              q: <>The columns of a matrix tell you…</>,
              options: ["its determinant directly", "where the basis vectors land under the transformation", "its rank, always"],
              answer: 1,
              explain: <>Reading a matrix as a transformation: column j is the image of the j-th basis vector. Everything else follows by linearity.</>,
            },
            {
              q: <>A determinant of zero means the matrix…</>,
              options: ["is symmetric", "collapses space to a lower dimension and has no inverse", "has negative eigenvalues"],
              answer: 1,
              explain: <>Zero determinant = space flattened onto a line/point = information lost = not invertible (rank-deficient).</>,
            },
            {
              q: <>An eigenvector of <M>A</M> is a direction that <M>A</M>…</>,
              options: ["rotates by 90°", "leaves pointing the same way, only scaled by its eigenvalue", "sends to zero always"],
              answer: 1,
              explain: <><M>{String.raw`A\mathbf v = \lambda\mathbf v`}</M>: same direction, scaled by <M>{String.raw`\lambda`}</M>. Only <M>{String.raw`\lambda=0`}</M> collapses it.</>,
            },
            {
              q: <>Covariance and kernel matrices are always positive semidefinite because…</>,
              options: ["they're square", "the quadratic form (a variance / a squared norm) can't be negative", "they have determinant 1"],
              answer: 1,
              explain: <>Variance in any direction is <M>{String.raw`\ge 0`}</M>, so <M>{String.raw`\mathbf x^\top\Sigma\mathbf x\ge 0`}</M> — the PSD condition, hence non-negative eigenvalues.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/math-foundations/svd", label: <>← The singular value decomposition</> }}
          next={{ href: "/learn/math-foundations/derivatives", label: <>Next up · Derivatives: the rate of change →</> }}
        />
      </div>
    </article>
  );
}
