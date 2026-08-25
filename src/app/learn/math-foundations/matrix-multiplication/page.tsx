import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Matrix multiplication & composition — Manifold",
  description:
    "Matrix multiplication looks like an arbitrary rule until you see what it means: doing one transformation after another. That's why it's associative but not commutative, and why the shapes have to line up.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MatrixMultiplicationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Linear algebra", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Matrix multiplication &amp; composition</>}
        intro={<>The rule for multiplying matrices — row times column, summed — feels invented until you know its job:
          <M>{String.raw`AB`}</M> is the single transformation you get by doing <M>B</M> first, then <M>A</M>. Every
          strange property of matrix multiplication follows from that one fact.</>}
      />

      <div className="lesson">
        <h2>Multiplication is composition</h2>
        <p>
          If <M>B</M> moves space one way and <M>A</M> moves it another, then applying them in sequence —{" "}
          <M>{String.raw`A(B\mathbf x)`}</M> — is itself a linear transformation, and its matrix is the product{" "}
          <M>{String.raw`AB`}</M>:
        </p>
        <MathBlock>{String.raw`(AB)\,\mathbf x = A\,(B\,\mathbf x).`}</MathBlock>
        <p>
          The entry-by-entry rule, <M>{String.raw`(AB)_{ik} = \sum_j A_{ij}B_{jk}`}</M>, is just the bookkeeping that
          makes this true. You never need to memorise it as a ritual — it&rsquo;s the arithmetic of &ldquo;where does
          each basis vector end up after both moves.&rdquo;
        </p>

        <h2>The properties, explained by the picture</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Not commutative:</strong> <M>{String.raw`AB \neq BA`}</M> in general — rotating then shearing is not the same as shearing then rotating. Order of operations matters because order of <em>motions</em> matters.</li>
          <li><strong>Associative:</strong> <M>{String.raw`(AB)C = A(BC)`}</M> — however you group the sequence, it&rsquo;s the same overall motion. This is what lets you fold a whole stack of neural-network layers into reasoning about one composed map.</li>
          <li><strong>Shapes must line up:</strong> an <M>{String.raw`m\times n`}</M> times an <M>{String.raw`n\times p`}</M> gives <M>{String.raw`m\times p`}</M>. The inner dimensions must match because the output of the first transform is the input of the second.</li>
        </ul>

        <h2>Why it&rsquo;s everywhere</h2>
        <p>
          A neural network is a chain of matrix multiplications (with a nonlinearity between each): each layer
          transforms the previous layer&rsquo;s vector. Composing rotations builds 3-D graphics. Multiplying a data
          matrix <M>X</M> by a weight vector computes every prediction at once. And{" "}
          <M>{String.raw`X^\top X`}</M> — a matrix times its own transpose — is the unnormalised{" "}
          <Link href="/learn/pca/centering-and-covariance" style={link}>covariance matrix</Link> at the heart of PCA
          and least squares.
        </p>

        <Callout color={AMBER} title={<>The transpose, in one line</>}>
          The <strong>transpose</strong> <M>{String.raw`A^\top`}</M> flips a matrix across its diagonal (rows become
          columns). It shows up constantly: <M>{String.raw`\mathbf a^\top\mathbf b`}</M> is the dot product written
          as matrices, and <M>{String.raw`(AB)^\top = B^\top A^\top`}</M> — the reverse order, because undoing a
          sequence of motions means undoing the last one first.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/matrices", label: <>← Matrices as transformations</> }}
          next={{ href: "/learn/math-foundations/rank-and-systems", label: <>Next up · Rank, inverses &amp; linear systems →</> }}
        />
      </div>
    </article>
  );
}
