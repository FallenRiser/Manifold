import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { VectorLab } from "@/components/labs/VectorLab";

export const metadata = {
  title: "Vectors & vector spaces — Manifold",
  description:
    "A vector is a list of numbers you can add and scale — and that's the whole object all of machine learning is written in. Points, arrows, data rows, and model weights are all vectors.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function VectorsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Linear algebra", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Vectors &amp; vector spaces</>}
        intro={<>Before anything else, machine learning needs a way to write down &ldquo;a thing.&rdquo; A house, a
          patient, an image, a word — each becomes a <em>list of numbers</em>. That list is a vector, and almost
          every method you&rsquo;ll learn is just clever arithmetic on vectors.</>}
      />

      <div className="lesson">
        <h2>Three ways to see one thing</h2>
        <p>
          A vector like <M>{String.raw`\mathbf{v} = (3, 1)`}</M> can be read three ways, and switching between them
          fluently is most of the skill:
        </p>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>A point</strong> at coordinates (3, 1) — where a data example <em>sits</em> in space.</li>
          <li><strong>An arrow</strong> from the origin to that point — a direction with a length.</li>
          <li><strong>A list</strong> [3, 1] — just the numbers, which is how a computer stores it.</li>
        </ul>
        <p>
          A dataset row with 20 columns is a vector in 20-dimensional space; you can&rsquo;t picture it, but every
          rule below works identically no matter how many numbers are in the list.
        </p>

        <h2>The only two operations</h2>
        <p>
          A vector space is defined by two moves, and everything else is built from them. You can <strong>add</strong>
          two vectors (line them up tip-to-tail) and you can <strong>scale</strong> one by a number (stretch or
          flip it):
        </p>
        <MathBlock>{String.raw`\mathbf{a}+\mathbf{b} = (a_1+b_1,\; a_2+b_2), \qquad c\,\mathbf{a} = (c\,a_1,\; c\,a_2).`}</MathBlock>

        <LabFrame
          accent={AMBER}
          tryThis={<>Drag the tips of <M>{String.raw`\mathbf a`}</M> and <M>{String.raw`\mathbf b`}</M>. The dashed
            parallelogram shows why addition is &ldquo;tip-to-tail&rdquo; — the sum is the far corner. Can you make{" "}
            <M>{String.raw`\mathbf a + \mathbf b = 0`}</M>?</>}
          insight={<>The sum reaches the opposite corner of the parallelogram the two vectors span. Setting{" "}
            <M>{String.raw`\mathbf b = -\mathbf a`}</M> (same length, opposite direction) lands the sum exactly on the
            origin — vectors have negatives, just like numbers.</>}
        >
          <VectorLab />
        </LabFrame>

        <h2>Linear combinations &amp; span</h2>
        <p>
          Combine the two operations — scale some vectors and add the results — and you get a{" "}
          <strong>linear combination</strong>: <M>{String.raw`c_1\mathbf{a} + c_2\mathbf{b}`}</M>. As you let the
          weights <M>{String.raw`c_1, c_2`}</M> range over all numbers, the set of points you can reach is the{" "}
          <strong>span</strong> of those vectors. Two vectors pointing different ways span the whole plane; if they
          point the same way, they only span a line. This one idea — what can I build by combining these directions? —
          runs through <Link href="/learn/math-foundations/rank-and-systems" style={link}>rank, linear systems</Link>,
          and the <Link href="/learn/pca" style={link}>principal components</Link> of PCA.
        </p>

        <Callout color={AMBER} title={<>Where this shows up</>}>
          A linear model&rsquo;s prediction <M>{String.raw`\mathbf{w}^\top\mathbf{x}`}</M> is a linear combination of
          features weighted by <M>{String.raw`\mathbf w`}</M>. Gradient descent moves a weight <em>vector</em>. A
          neural layer maps one vector to another. Get comfortable adding and scaling vectors and a surprising amount
          of ML stops looking like magic.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations", label: <>← Math foundations</> }}
          next={{ href: "/learn/math-foundations/norms", label: <>Next up · Norms &amp; distance →</> }}
        />
      </div>
    </article>
  );
}
