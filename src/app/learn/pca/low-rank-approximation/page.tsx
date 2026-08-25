import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The best low-rank approximation — Manifold",
  description:
    "The Eckart–Young theorem is why PCA is not just a good idea but the provably optimal one: truncating the SVD gives the closest possible rank-k matrix to your data. No other k directions can do better.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LowRankPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 7 minutes"
        title={<>The best low-rank approximation</>}
        intro={<>PCA doesn&rsquo;t just give <em>a</em> compact summary of your data — it gives the <em>best</em> one.
          The Eckart–Young theorem makes that precise: no rank-<M>k</M> matrix is closer to your data than the one you
          get by truncating the SVD. This is the theorem that turns PCA from heuristic into optimum.</>}
      />

      <div className="lesson">
        <h2>Truncating the SVD</h2>
        <p>
          Write the SVD as a sum of rank-one pieces, one per singular value:
        </p>
        <MathBlock>{String.raw`\tilde X = \sum_{j=1}^{d} s_j\, u_j v_j^\top.`}</MathBlock>
        <p>
          Keep only the first <M>k</M> terms — the largest singular values — and you get{" "}
          <M>{String.raw`\tilde X_k = \sum_{j=1}^{k} s_j u_j v_j^\top`}</M>, a matrix of rank <M>k</M>. This is
          exactly the PCA reconstruction from <M>k</M> components: each point replaced by its shadow on the top-<M>k</M>{" "}
          surface.
        </p>

        <h2>The Eckart–Young theorem</h2>
        <p>
          The claim is that this truncation is unbeatable. Among <em>all</em> matrices <M>B</M> of rank at most{" "}
          <M>k</M>, the truncated SVD is the closest one to <M>{String.raw`\tilde X`}</M>:
        </p>
        <MathBlock>{String.raw`\min_{\operatorname{rank}(B)\le k}\; \lVert \tilde X - B \rVert_F \;=\; \lVert \tilde X - \tilde X_k \rVert_F \;=\; \sqrt{\textstyle\sum_{j>k} s_j^2}.`}</MathBlock>
        <p>
          The error you&rsquo;re left with is set entirely by the singular values you dropped — and it is the smallest
          error <em>any</em> rank-<M>k</M> matrix can achieve. (The theorem holds for the spectral norm too, not just
          the Frobenius norm <M>{String.raw`\lVert\cdot\rVert_F`}</M> used here.) In PCA units, that residual is the
          discarded variance <M>{String.raw`\sum_{j>k}\lambda_j`}</M> we met on the{" "}
          <Link href="/learn/pca/reconstruction" style={link}>reconstruction page</Link> — now revealed as a global
          optimum, not just the value PCA happens to hit.
        </p>

        <h2>Why this is a big deal</h2>
        <p>
          There are infinitely many ways to pick <M>k</M> directions and project onto them. Eckart–Young says the
          greedy variance-maximising choice — take the top eigenvectors — is not merely reasonable but{" "}
          <strong>globally optimal</strong> for squared error. You cannot outperform PCA at linear reconstruction by
          any cleverer choice of a flat <M>k</M>-dimensional subspace. Every improvement beyond it must abandon
          &ldquo;flat&rdquo; (kernel PCA, manifolds) or abandon &ldquo;reconstruction&rdquo; as the goal (LDA,
          t-SNE) — which is the map of the entire <Link href="/learn/pca/vs-alternatives" style={link}>rest of the
          family</Link>.
        </p>

        <Callout color={DIM} title={<>The same theorem powers image compression</>}>
          Treat a grayscale image as a matrix of pixel values and truncate its SVD: you store <M>k</M> singular
          values plus their vectors instead of the whole grid, and Eckart–Young guarantees it&rsquo;s the best
          rank-<M>k</M> image possible. It&rsquo;s the same optimality that let 20 components rebuild a legible digit —
          low-rank approximation and dimensionality reduction are one idea.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/pca/svd", label: <>← PCA through the SVD</> }}
          next={{ href: "/learn/pca/linear-autoencoder", label: <>Next up · PCA is a linear autoencoder →</> }}
        />
      </div>
    </article>
  );
}
