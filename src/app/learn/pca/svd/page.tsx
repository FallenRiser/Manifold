import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "PCA through the SVD — Manifold",
  description:
    "In practice nobody forms the covariance matrix. The singular value decomposition of the centered data gives the same components, more accurately and more cheaply — it's what scikit-learn actually runs.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SvdPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>PCA through the SVD</>}
        intro={<>The eigen-decomposition of the covariance matrix is the right way to <em>understand</em> PCA and the
          wrong way to <em>compute</em> it. The singular value decomposition gets the identical answer straight from
          the data, without ever squaring it into a covariance matrix — which is why every real implementation uses
          it.</>}
      />

      <div className="lesson">
        <h2>The singular value decomposition</h2>
        <p>
          Any matrix — including your centered data matrix <M>{String.raw`\tilde X`}</M> (rows = points, columns =
          features) — factors into three pieces:
        </p>
        <MathBlock>{String.raw`\tilde X = U\, S\, V^\top.`}</MathBlock>
        <p>
          Here <M>{String.raw`V`}</M>&rsquo;s columns are orthonormal directions in feature space,{" "}
          <M>{String.raw`U`}</M>&rsquo;s columns are orthonormal directions in &ldquo;sample space,&rdquo; and{" "}
          <M>{String.raw`S`}</M> is diagonal with non-negative <strong>singular values</strong>{" "}
          <M>{String.raw`s_1 \ge s_2 \ge \cdots \ge 0`}</M>. It always exists, for any shape of matrix.
        </p>

        <h2>Why it&rsquo;s exactly PCA</h2>
        <p>
          Plug the factorisation into the covariance matrix and the middle collapses because{" "}
          <M>{String.raw`U^\top U = I`}</M>:
        </p>
        <MathBlock>{String.raw`\Sigma = \frac{1}{n-1}\tilde X^\top \tilde X = \frac{1}{n-1} V S U^\top U S V^\top = V\!\left(\frac{S^2}{n-1}\right)\! V^\top.`}</MathBlock>
        <p>
          That last expression <em>is</em> the eigen-decomposition of <M>{String.raw`\Sigma`}</M>. So:
        </p>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li>the <strong>right singular vectors</strong> <M>{String.raw`V`}</M> are the principal components — the eigenvectors of <M>{String.raw`\Sigma`}</M>;</li>
          <li>the <strong>eigenvalues</strong> are <M>{String.raw`\lambda_j = s_j^2/(n-1)`}</M> — squared singular values, rescaled;</li>
          <li>the <strong>scores</strong> are <M>{String.raw`US`}</M> — the data already expressed in the new coordinates.</li>
        </ul>
        <p>
          This isn&rsquo;t an approximation. Run both routes on <code>load_digits</code> and the eigenvalues agree to
          <strong> 13 decimal places</strong> (max difference <M>{String.raw`4\times10^{-13}`}</M> across all 64) — a
          real check in <code>scripts/pca_cases.py</code>. Same components, same variances, two roads.
        </p>

        <h2>So why prefer the SVD?</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Numerical stability.</strong> Forming <M>{String.raw`\tilde X^\top \tilde X`}</M> squares the data, which squares the condition number and can drown small components in round-off. The SVD works on <M>{String.raw`\tilde X`}</M> directly and keeps that precision.</li>
          <li><strong>Cost when <M>d</M> is huge.</strong> If you have 10,000 features but only 500 samples, <M>{String.raw`\Sigma`}</M> is a 10,000×10,000 monster while the SVD works with the 500×10,000 data. Truncated/randomized SVD gets just the top <M>k</M> components without touching the rest.</li>
          <li><strong>No centering trap.</strong> You can even PCA a sparse matrix without densifying it by centering — <code>TruncatedSVD</code> skips the mean-subtraction for exactly this reason (with the caveat that it&rsquo;s then not <em>quite</em> PCA).</li>
        </ul>

        <Callout color={DIM} title={<>What scikit-learn actually does</>}>
          <code>sklearn.decomposition.PCA</code> runs an SVD of the centered data, not an eigen-decomposition of a
          covariance matrix. For big problems it switches to a <em>randomized</em> SVD that estimates only the top
          <M> k</M> components in a fraction of the time. When you call <code>.fit()</code>, this is the machinery
          underneath — and it&rsquo;s why the <code>components_</code> it returns are <M>{String.raw`V`}</M>&rsquo;s
          rows.
        </Callout>

        <p>
          The SVD view also unlocks the deepest fact about PCA: that keeping the top components gives the provably{" "}
          <Link href="/learn/pca/low-rank-approximation" style={link}>best low-rank approximation</Link> of your data
          — the Eckart–Young theorem, next.
        </p>

        <PrevNext
          prev={{ href: "/learn/pca/standardize-first", label: <>← Standardize before you PCA</> }}
          next={{ href: "/learn/pca/low-rank-approximation", label: <>Next up · The best low-rank approximation →</> }}
        />
      </div>
    </article>
  );
}
