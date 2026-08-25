import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { RayleighLab } from "@/components/labs/RayleighLab";

export const metadata = {
  title: "The Rayleigh quotient & why eigenvectors — Manifold",
  description:
    "Why is the maximum-variance direction exactly the top eigenvector, and the maximum value exactly the top eigenvalue? The Rayleigh quotient and one Lagrange multiplier close the loop.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RayleighPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 7 minutes"
        title={<>The Rayleigh quotient &amp; why eigenvectors</>}
        intro={<>We&rsquo;ve leaned on the claim that the variance-maximising direction is the top eigenvector of{" "}
          <M>{String.raw`\Sigma`}</M>. Here is the proof — two lines of calculus with a Lagrange multiplier — plus a
          lab that lets you see the maximum sitting exactly where the theory says it must.</>}
      />

      <div className="lesson">
        <h2>The constrained problem</h2>
        <p>
          PCA&rsquo;s first component solves: maximise the projected variance <M>{String.raw`v^\top\Sigma v`}</M>
          subject to <M>v</M> being a unit vector, <M>{String.raw`v^\top v = 1`}</M>. The ratio being maximised,
        </p>
        <MathBlock>{String.raw`R(v) = \frac{v^\top \Sigma\, v}{v^\top v},`}</MathBlock>
        <p>
          is the famous <strong>Rayleigh quotient</strong>. Because it&rsquo;s scale-free (multiplying <M>v</M> by a
          constant leaves it unchanged), maximising it over all nonzero <M>v</M> is the same as maximising the
          numerator over unit vectors — the constraint just removes the redundancy.
        </p>

        <h2>One Lagrange multiplier</h2>
        <p>
          Attach a multiplier <M>{String.raw`\lambda`}</M> to the unit-length constraint and set the gradient of{" "}
          <M>{String.raw`\mathcal L(v,\lambda) = v^\top\Sigma v - \lambda(v^\top v - 1)`}</M> to zero:
        </p>
        <MathBlock>{String.raw`\nabla_v \mathcal L = 2\Sigma v - 2\lambda v = 0 \;\;\Longrightarrow\;\; \Sigma v = \lambda v.`}</MathBlock>
        <p>
          The stationarity condition <em>is</em> the eigenvalue equation. So every critical direction of the variance
          is an eigenvector of <M>{String.raw`\Sigma`}</M>, and its multiplier is the eigenvalue. Which one is the
          maximum? Multiply <M>{String.raw`\Sigma v = \lambda v`}</M> on the left by <M>{String.raw`v^\top`}</M>:
        </p>
        <MathBlock>{String.raw`v^\top \Sigma v = \lambda\, v^\top v = \lambda.`}</MathBlock>
        <p>
          The variance achieved <em>equals</em> the eigenvalue. To maximise variance, pick the eigenvector with the
          largest eigenvalue — PC1. For PC2, add the constraint that <M>v</M> be orthogonal to PC1 and repeat; you get
          the next eigenvector, and so on down the spectrum. That is the entire PCA algorithm, derived.
        </p>

        <h2>See the maximum</h2>
        <p>
          The lab traces <M>{String.raw`v^\top\Sigma v`}</M> as a polar &ldquo;variance rose&rdquo; while you sweep{" "}
          <M>v</M> around the circle. Its two lobes peak at the eigenvectors, with heights equal to the eigenvalues.
        </p>

        <LabFrame
          accent={DIM}
          tryThis={<>Drag the arrow to the fattest part of the rose and read off the variance. Where does the maximum
            sit relative to the dashed eigenvector line, and how does its value compare to <M>{String.raw`\lambda_1`}</M>?</>}
          insight={<>The maximum lands exactly on the <M>{String.raw`\lambda_1`}</M> eigenvector and its value equals{" "}
            <M>{String.raw`\lambda_1`}</M> — the minimum sits at the orthogonal eigenvector with value{" "}
            <M>{String.raw`\lambda_2`}</M>. The rose is just <M>{String.raw`R(v)`}</M> drawn in polar form; PCA reads
            off its longest spoke.</>}
        >
          <RayleighLab />
        </LabFrame>

        <Callout color={DIM} title={<>Why symmetric matrices are so friendly</>}>
          Everything above worked because <M>{String.raw`\Sigma`}</M> is symmetric: the spectral theorem guarantees
          real eigenvalues and orthogonal eigenvectors. That&rsquo;s what lets PCA promise perpendicular components
          and real variances. A non-symmetric matrix could have complex eigenvalues and non-orthogonal eigenvectors —
          but a covariance matrix is symmetric by construction, so PCA is always well-behaved.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/pca/two-objectives", label: <>← Two objectives, one answer</> }}
          next={{ href: "/learn/pca/computing-the-components", label: <>Next up · Computing the components: power iteration →</> }}
        />
      </div>
    </article>
  );
}
