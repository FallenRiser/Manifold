import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Rank, inverses & linear systems — Manifold",
  description:
    "Rank counts the genuinely independent directions in a matrix. It tells you whether a linear system has a unique solution, and it's why least squares exists at all when a system has no exact answer.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RankSystemsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Linear algebra", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Rank, inverses &amp; linear systems</>}
        intro={<>&ldquo;Solve <M>{String.raw`A\mathbf x = \mathbf b`}</M>&rdquo; is the most common request in all of
          applied math. Whether it has one solution, none, or infinitely many comes down to a single number — the
          rank — and understanding it explains why least squares had to be invented.</>}
      />

      <div className="lesson">
        <h2>Rank: how many independent directions</h2>
        <p>
          The <strong>rank</strong> of a matrix is the number of linearly independent columns — the true
          dimensionality of the space its columns <Link href="/learn/math-foundations/vectors" style={link}>span</Link>.
          If two columns are copies (or scaled copies) of each other, they add no new direction, and the rank is
          below the column count. Rank is the honest count of &ldquo;how much this matrix can actually reach.&rdquo;
        </p>
        <p>
          A square matrix is <strong>full rank</strong> exactly when its <Link href="/learn/math-foundations/matrices" style={link}>determinant
          is nonzero</Link> — when it doesn&rsquo;t collapse space onto a lower dimension. Full-rank square matrices
          have an <strong>inverse</strong> <M>{String.raw`A^{-1}`}</M> that undoes them; rank-deficient ones do not,
          because you can&rsquo;t un-flatten what&rsquo;s been flattened.
        </p>

        <h2>When does Ax = b have a solution?</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Exactly one solution</strong> — <M>A</M> is square and full rank; then <M>{String.raw`\mathbf x = A^{-1}\mathbf b`}</M> (though in practice you never invert; you solve directly, which is faster and stabler).</li>
          <li><strong>No exact solution</strong> — <M>{String.raw`\mathbf b`}</M> lies outside the span of <M>A</M>&rsquo;s columns. This is the <em>normal</em> situation in ML: more equations (data points) than unknowns (weights).</li>
          <li><strong>Infinitely many</strong> — <M>A</M> is rank-deficient; the solution has free directions. This is <em>underdetermined</em>: more unknowns than independent constraints.</li>
        </ul>

        <h2>No solution? Least squares</h2>
        <p>
          When there&rsquo;s no exact <M>{String.raw`\mathbf x`}</M>, you settle for the closest miss: the{" "}
          <M>{String.raw`\mathbf x`}</M> that makes <M>{String.raw`A\mathbf x`}</M> as near <M>{String.raw`\mathbf b`}</M>
          as possible. That&rsquo;s <strong>least squares</strong>, and its solution is the{" "}
          <em>normal equations</em>:
        </p>
        <MathBlock>{String.raw`A^\top A\,\mathbf x = A^\top \mathbf b \;\;\Longrightarrow\;\; \mathbf x = (A^\top A)^{-1}A^\top \mathbf b.`}</MathBlock>
        <p>
          Geometrically, this <Link href="/learn/math-foundations/dot-product" style={link}>projects</Link>{" "}
          <M>{String.raw`\mathbf b`}</M> onto the span of <M>A</M>&rsquo;s columns — the reachable subspace — and
          solves exactly there. It&rsquo;s the entire engine of <Link href="/learn/linear-regression" style={link}>linear
          regression</Link>. And when <M>{String.raw`A^\top A`}</M> is near-singular (rank-deficient features),{" "}
          <Link href="/learn/regularized-regression" style={link}>ridge regression</Link> adds a term to make it
          invertible again — regularization as a rank rescue.
        </p>

        <Callout color={AMBER} title={<>Rank deficiency is a data smell</>}>
          If two features are perfectly correlated, your data matrix is rank-deficient and the plain least-squares
          solution blows up or becomes non-unique — the same <Link href="/learn/pca/standardize-first" style={link}>redundancy
          PCA exploits</Link>. Multicollinearity, singular matrices, and &ldquo;why are my coefficients unstable?&rdquo;
          are all one phenomenon: not enough independent directions.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/matrix-multiplication", label: <>← Matrix multiplication &amp; composition</> }}
          next={{ href: "/learn/math-foundations/eigenvectors", label: <>Next up · Eigenvectors &amp; eigenvalues →</> }}
        />
      </div>
    </article>
  );
}
