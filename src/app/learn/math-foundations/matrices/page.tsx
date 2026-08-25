import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { MatrixTransformLab } from "@/components/labs/MatrixTransformLab";

export const metadata = {
  title: "Matrices as transformations — Manifold",
  description:
    "The most useful way to think about a matrix isn't a grid of numbers — it's a function that moves space. Its columns say where the basis vectors land, and the determinant says how much it stretches area.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MatricesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Linear algebra", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Matrices as transformations</>}
        intro={<>A matrix looks like a grid of numbers. It <em>behaves</em> like a verb: it takes in a vector and
          moves it somewhere else, warping all of space in a consistent, linear way. Once you see matrices as
          transformations, eigenvectors and the SVD stop being formulas and become pictures.</>}
      />

      <div className="lesson">
        <h2>Columns say where the axes go</h2>
        <p>
          Multiplying a matrix by a vector, <M>{String.raw`\mathbf y = M\mathbf x`}</M>, transforms <M>{String.raw`\mathbf x`}</M>.
          The trick to reading any matrix: its <strong>columns are the landing spots of the basis vectors</strong>.
          The first column is where <M>{String.raw`\hat{\imath}=(1,0)`}</M> ends up; the second is where{" "}
          <M>{String.raw`\hat{\jmath}=(0,1)`}</M> ends up. Because the transformation is linear, that&rsquo;s all you
          need — every other point just rides along:
        </p>
        <MathBlock>{String.raw`M\mathbf x = x_1\,(\text{col}_1) + x_2\,(\text{col}_2).`}</MathBlock>

        <LabFrame
          accent={AMBER}
          tryThis={<>Tune the four entries, or hit a preset. Watch î and ĵ (and the whole unit square) move. Now push
            the determinant to zero — what happens to the square? And make it negative — watch the corner notch flip.</>}
          insight={<>The columns drag the basis vectors wherever you point them. Determinant zero collapses the square
            onto a line (the transform is <em>singular</em> — information is lost); negative determinant mirrors space
            (the notch flips), meaning orientation reversed.</>}
        >
          <MatrixTransformLab />
        </LabFrame>

        <h2>The determinant is the area factor</h2>
        <p>
          The <strong>determinant</strong> <M>{String.raw`\det M = ad - bc`}</M> (for a 2×2) measures how much the
          transformation scales area. A determinant of 2 doubles areas; 0.5 halves them; <strong>0</strong> flattens
          everything onto a line or point, which is exactly when the matrix has no inverse — you can&rsquo;t undo a
          transformation that threw information away. A negative determinant means space was flipped over.
        </p>

        <Callout color={AMBER} title={<>Why this framing pays off</>}>
          Rotations, scalings, shears, projections — all are matrices, distinguished only by <em>how</em> they move
          space. An <Link href="/learn/math-foundations/eigenvectors" style={link}>eigenvector</Link> is then easy to
          picture: a direction the transformation leaves pointing the same way. And the{" "}
          <Link href="/learn/math-foundations/svd" style={link}>SVD</Link> says <em>every</em> matrix is secretly a
          rotation, then a scaling, then another rotation. Hold onto &ldquo;matrix = motion&rdquo; and the rest of
          the strand falls into place.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/dot-product", label: <>← The dot product &amp; projection</> }}
          next={{ href: "/learn/math-foundations/matrix-multiplication", label: <>Next up · Matrix multiplication &amp; composition →</> }}
        />
      </div>
    </article>
  );
}
