import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { NormBallLab } from "@/components/labs/NormBallLab";

export const metadata = {
  title: "Norms & distance — Manifold",
  description:
    "A norm measures the size of a vector, and the choice of norm quietly shapes half of machine learning — L2 for least squares and ridge, L1 for lasso's sparsity, L∞ for worst-case bounds.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function NormsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Linear algebra", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Norms &amp; distance</>}
        intro={<>How &ldquo;big&rdquo; is a vector, and how far apart are two of them? The answer isn&rsquo;t unique —
          there&rsquo;s a whole family of norms, and which one you pick changes what your model prefers. This is one of
          those small choices with outsized consequences.</>}
      />

      <div className="lesson">
        <h2>The p-norm family</h2>
        <p>
          A <strong>norm</strong> <M>{String.raw`\lVert\mathbf{x}\rVert`}</M> is a single number measuring a
          vector&rsquo;s length. The workhorse is the <strong>Euclidean (L2) norm</strong> — ordinary
          straight-line length from Pythagoras — but it&rsquo;s one member of the <M>p</M>-norm family:
        </p>
        <MathBlock>{String.raw`\lVert\mathbf{x}\rVert_p = \left(\sum_i |x_i|^p\right)^{1/p}.`}</MathBlock>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>L2</strong> (<M>p=2</M>): <M>{String.raw`\sqrt{x_1^2+x_2^2+\cdots}`}</M> — straight-line distance. The default everywhere.</li>
          <li><strong>L1</strong> (<M>p=1</M>): <M>{String.raw`|x_1|+|x_2|+\cdots`}</M> — &ldquo;taxicab&rdquo; distance, blocks along a grid.</li>
          <li><strong>L∞</strong> (<M>{String.raw`p\to\infty`}</M>): <M>{String.raw`\max_i |x_i|`}</M> — just the largest coordinate.</li>
        </ul>

        <h2>See the unit ball</h2>
        <p>
          The cleanest way to feel the difference is the <strong>unit ball</strong>: all the points at distance
          exactly 1. For L2 it&rsquo;s a circle; for L1 a diamond; for L∞ a square. That shape is <em>why</em> the
          norm behaves as it does.
        </p>

        <LabFrame
          accent={AMBER}
          tryThis={<>Slide <M>p</M> from 1 to 8. Watch the ball morph from diamond → circle → square, and watch the
            norm of the fixed point (0.7, 0.55) change even though the point never moves.</>}
          insight={<>Same point, different &ldquo;size&rdquo; depending on the norm — because each norm rewards
            spreading value across coordinates differently. The <em>corners</em> of the L1 diamond sit on the axes,
            which is the geometric reason L1 pushes solutions onto axes (i.e. to zero).</>}
        >
          <NormBallLab />
        </LabFrame>

        <h2>Why the choice matters in ML</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>L2</strong> defines squared-error loss and <Link href="/learn/regularized-regression" style={link}>ridge</Link> regularization — it shrinks all weights smoothly.</li>
          <li><strong>L1</strong> defines <Link href="/learn/regularized-regression" style={link}>lasso</Link>: its pointed diamond drives some weights exactly to zero, producing sparse, feature-selecting models.</li>
          <li><strong>L∞</strong> and worst-case norms appear in robustness and in the <Link href="/learn/math-foundations/hoeffding" style={link}>concentration bounds</Link> later in this track.</li>
        </ul>

        <Callout color={AMBER} title={<>Distance is just the norm of a difference</>}>
          The distance between two vectors is the norm of their difference,{" "}
          <M>{String.raw`d(\mathbf a,\mathbf b)=\lVert \mathbf a-\mathbf b\rVert`}</M>. Every distance-based method —{" "}
          <Link href="/learn/k-nearest-neighbors" style={link}>k-NN</Link>, <Link href="/learn/k-means" style={link}>k-means</Link>,
          clustering — is secretly a choice of norm. Change the norm and you change what &ldquo;nearby&rdquo; means.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/vectors", label: <>← Vectors &amp; vector spaces</> }}
          next={{ href: "/learn/math-foundations/dot-product", label: <>Next up · The dot product &amp; projection →</> }}
        />
      </div>
    </article>
  );
}
