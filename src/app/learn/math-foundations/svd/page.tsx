import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The singular value decomposition — Manifold",
  description:
    "The SVD says every matrix — any shape, any rank — is a rotation, then a scaling, then another rotation. It's the most useful factorization in applied math and the engine behind PCA, recommender systems, and least squares.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

function SvdFig() {
  const panel = (cx: number, rx: number, ry: number, rot: number, label: string) => (
    <g>
      <text x={cx} y={24} textAnchor="middle" fontSize={11} fill="var(--muted)">{label}</text>
      <line x1={cx - 56} y1={110} x2={cx + 56} y2={110} stroke="var(--border)" strokeWidth={1} />
      <line x1={cx} y1={54} x2={cx} y2={166} stroke="var(--border)" strokeWidth={1} />
      <ellipse cx={cx} cy={110} rx={rx} ry={ry} transform={`rotate(${rot} ${cx} 110)`} fill={`color-mix(in srgb, ${AMBER} 14%, transparent)`} stroke={AMBER} strokeWidth={1.6} />
    </g>
  );
  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: 14 }}>
        <svg viewBox="0 0 560 190" style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="A circle becomes an ellipse: rotate, scale, rotate">
          {panel(70, 42, 42, 0, "unit circle")}
          {panel(210, 42, 42, -20, "Vᵀ · rotate")}
          {panel(360, 58, 26, -20, "Σ · scale")}
          {panel(500, 58, 26, 18, "U · rotate")}
          <text x={140} y={110} textAnchor="middle" fontSize={15} fill="var(--faint)">→</text>
          <text x={285} y={110} textAnchor="middle" fontSize={15} fill="var(--faint)">→</text>
          <text x={430} y={110} textAnchor="middle" fontSize={15} fill="var(--faint)">→</text>
        </svg>
      </div>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
        Any matrix maps the unit circle to an ellipse. The SVD reads that off in three moves: rotate
        (<M>{String.raw`V^\top`}</M>), stretch along axes (<M>{String.raw`\Sigma`}</M>, the singular values), rotate
        again (<M>U</M>). The ellipse&rsquo;s axis lengths <em>are</em> the singular values.
      </figcaption>
    </figure>
  );
}

export default function SvdPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Linear algebra", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>The singular value decomposition</>}
        intro={<>Eigenvectors only work cleanly for square matrices. The SVD generalises the whole idea to <em>any</em>
          matrix, of any shape, and says something breathtaking: every linear map is just a rotation, a scaling, and
          another rotation. It&rsquo;s the Swiss-army knife of numerical machine learning.</>}
      />

      <div className="lesson">
        <h2>Every matrix, three simple moves</h2>
        <MathBlock>{String.raw`A = U\,\Sigma\,V^\top.`}</MathBlock>
        <p>
          Here <M>V</M> and <M>U</M> are <strong>rotations</strong> (orthogonal matrices — they turn space without
          stretching it) and <M>{String.raw`\Sigma`}</M> is a diagonal <strong>scaling</strong> whose non-negative
          entries <M>{String.raw`s_1 \ge s_2 \ge \cdots \ge 0`}</M> are the <strong>singular values</strong>. Read
          right to left: rotate the input (<M>{String.raw`V^\top`}</M>), stretch each axis (<M>{String.raw`\Sigma`}</M>),
          rotate the result (<M>U</M>).
        </p>

        <SvdFig />

        <p>
          The singular values rank the directions by how much the matrix stretches them — the biggest one is the
          direction of maximum amplification. This holds for a tall data matrix, a wide one, a rank-deficient one,
          any of them. Where eigenvectors demand a square matrix, the SVD asks for nothing.
        </p>

        <h2>Its connection to eigenvectors</h2>
        <p>
          The two decompositions are intimately related: the columns of <M>V</M> are the eigenvectors of{" "}
          <M>{String.raw`A^\top A`}</M>, and the singular values are the square roots of that matrix&rsquo;s
          eigenvalues. That&rsquo;s exactly why <Link href="/learn/pca/svd" style={link}>PCA can be computed by an
          SVD of the data</Link> instead of an eigen-decomposition of the covariance — same answer, but more accurate
          and without ever forming <M>{String.raw`A^\top A`}</M>.
        </p>

        <h2>Why it&rsquo;s everywhere in ML</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>PCA &amp; compression.</strong> Keep the top few singular values and you get the best low-rank approximation of a matrix — the <Link href="/learn/pca/low-rank-approximation" style={link}>Eckart–Young theorem</Link>. Same trick compresses images.</li>
          <li><strong>Recommender systems.</strong> Truncated SVD of a user–item ratings matrix uncovers latent factors (&ldquo;taste&rdquo; directions) — the basis of matrix-factorization recommenders.</li>
          <li><strong>Solving least squares stably.</strong> The <em>pseudo-inverse</em>, built from the SVD, solves <M>{String.raw`A\mathbf x=\mathbf b`}</M> even when <M>A</M> is rank-deficient — where the <Link href="/learn/math-foundations/rank-and-systems" style={link}>normal equations</Link> fail.</li>
        </ul>

        <Callout color={AMBER} title={<>The one-line takeaway</>}>
          <strong>Every matrix is a rotation, a scaling, and a rotation.</strong> The singular values say how much it
          stretches, ranked; the singular vectors say along which directions. Keep the big ones, drop the small ones,
          and you have compression, denoising, and dimensionality reduction — the whole reason the SVD is the most
          important factorization you&rsquo;ll meet.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/eigenvectors", label: <>← Eigenvectors &amp; eigenvalues</> }}
          next={{ href: "/learn/math-foundations/spd-matrices", label: <>Next up · Symmetric positive-definite matrices →</> }}
        />
      </div>
    </article>
  );
}
