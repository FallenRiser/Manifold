import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PowerIterationLab } from "@/components/labs/PowerIterationLab";

export const metadata = {
  title: "Eigenvectors & eigenvalues — Manifold",
  description:
    "An eigenvector is a direction a matrix leaves pointing the same way, only stretched. Eigenvalues are the stretch factors. They reveal a transformation's 'natural axes' and power PCA, PageRank, and stability analysis.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function EigenvectorsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Linear algebra", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Eigenvectors &amp; eigenvalues</>}
        intro={<>Most directions get rotated when a matrix acts on them. A special few come back pointing exactly the
          same way, merely longer or shorter. Those are the matrix&rsquo;s eigenvectors — its natural axes — and they
          unlock how a transformation &ldquo;really&rdquo; behaves.</>}
      />

      <div className="lesson">
        <h2>The defining equation</h2>
        <p>
          A vector <M>{String.raw`\mathbf v`}</M> is an <strong>eigenvector</strong> of <M>A</M> if applying <M>A</M>
          only scales it:
        </p>
        <MathBlock>{String.raw`A\mathbf v = \lambda \mathbf v.`}</MathBlock>
        <p>
          The scalar <M>{String.raw`\lambda`}</M> is the <strong>eigenvalue</strong> — the stretch factor along that
          direction. Picture the <Link href="/learn/math-foundations/matrices" style={link}>matrix-as-motion</Link>:
          eigenvectors are the directions the motion doesn&rsquo;t twist, only lengthens (or, for{" "}
          <M>{String.raw`\lambda<0`}</M>, flips), and squashes flat when <M>{String.raw`\lambda=0`}</M>.
        </p>

        <h2>How you actually find them</h2>
        <p>
          By hand, you&rsquo;d solve the <strong>characteristic equation</strong>{" "}
          <M>{String.raw`\det(A-\lambda I)=0`}</M> for the eigenvalues, then find each eigenvector. By computer, you
          rarely do that — you <em>iterate</em>. The simplest method, <strong>power iteration</strong>, just keeps
          multiplying a vector by <M>A</M> and renormalising; it converges to the eigenvector with the largest
          eigenvalue, because that direction gets amplified fastest:
        </p>

        <LabFrame
          accent={AMBER}
          tryThis={<>Step the iteration. The gold <M>{String.raw`A\mathbf v`}</M> arrow always leans toward the top
            eigenvector, so renormalising drags your estimate onto it. Try a random start — does the destination
            change?</>}
          insight={<>From nearly any start it locks onto the dominant eigenvector in a handful of steps, and the
            readout climbs to that eigenvalue. This is the seed of how libraries — and PCA — find components at scale.</>}
        >
          <PowerIterationLab />
        </LabFrame>

        <h2>Diagonalization: the natural coordinate system</h2>
        <p>
          Collect the eigenvectors as columns of <M>V</M> and the eigenvalues on a diagonal matrix{" "}
          <M>{String.raw`\Lambda`}</M>, and a diagonalizable matrix factors as
        </p>
        <MathBlock>{String.raw`A = V\Lambda V^{-1}.`}</MathBlock>
        <p>
          Read right to left, this says: change into the eigenvector coordinate system, stretch each axis by its
          eigenvalue, change back. In eigen-coordinates the transformation is <em>just scaling</em> — the simplest
          possible motion. That&rsquo;s why eigen-decomposition is so powerful: it finds the coordinate system in
          which a complicated matrix becomes trivial.
        </p>

        <Callout color={AMBER} title={<>Where eigenvectors run the show</>}>
          <Link href="/learn/pca" style={link}>PCA</Link> takes the eigenvectors of the covariance matrix as its
          principal components. Google&rsquo;s PageRank is the top eigenvector of a web-link matrix. The stability of
          a dynamical system, the vibration modes of a bridge, the long-run behaviour of a Markov chain — all are
          eigenvalue questions. When something asks &ldquo;what does this process do in the long run, and along which
          directions?&rdquo;, the answer is eigenvectors. The <Link href="/learn/pca/rayleigh-and-eigen" style={link}>Rayleigh-quotient
          page</Link> in the PCA track proves why the <em>symmetric</em> case is especially clean.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/rank-and-systems", label: <>← Rank, inverses &amp; linear systems</> }}
          next={{ href: "/learn/math-foundations/svd", label: <>Next up · The singular value decomposition →</> }}
        />
      </div>
    </article>
  );
}
