import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Eigenvectors: the axes of the cloud — Manifold",
  description:
    "The directions PCA wants are the eigenvectors of the covariance matrix, and the variance along each is its eigenvalue. An eigenvector is the special direction a matrix leaves pointing the same way — which is exactly why it's an axis of the ellipse.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// server component figure — computed with Math at render time, emitted as static
// HTML (no "use client" here), so there is no hydration surface to worry about.
function EigenFig() {
  const A = 3, B = 1.2, C = 1;
  const S = 34;
  const mul = (x: number, y: number): [number, number] => [A * x + B * y, B * x + C * y];
  const CXa = 130, CY = 150, CXb = 330;
  // generic vector at 60deg
  const g = [Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)] as const;
  const Sg = mul(g[0], g[1]);
  // eigenvector (PC1 direction)
  const ang = 0.5 * Math.atan2(2 * B, A - C);
  const e = [Math.cos(ang), Math.sin(ang)] as const;
  const Se = mul(e[0], e[1]);
  const arrow = (cx: number, vx: number, vy: number, color: string, w: number) => {
    const x2 = cx + vx * S, y2 = CY - vy * S;
    return <line x1={cx} y1={CY} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke={color} strokeWidth={w} strokeLinecap="round" markerEnd="url(#ah)" />;
  };
  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: 14 }}>
        <svg viewBox="0 0 460 300" style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="A generic vector is rotated by the covariance matrix; an eigenvector is only scaled">
          <defs>
            <marker id="ah" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L6,3.5 L0,7 z" fill="context-stroke" /></marker>
          </defs>
          {/* left: generic vector rotates */}
          <text x={CXa} y={30} textAnchor="middle" fontSize={12} fill="var(--ink)" fontWeight={600}>a generic direction</text>
          {arrow(CXa, g[0], g[1], "var(--muted)", 2.2)}
          {arrow(CXa, Sg[0], Sg[1], DIM, 2.6)}
          <text x={CXa} y={280} textAnchor="middle" fontSize={11} fill="var(--muted)">Σv points a new way ↻</text>
          {/* right: eigenvector only scales */}
          <text x={CXb} y={30} textAnchor="middle" fontSize={12} fill="var(--ink)" fontWeight={600}>an eigenvector</text>
          {arrow(CXb, e[0], e[1], "var(--muted)", 2.2)}
          {arrow(CXb, Se[0], Se[1], DIM, 2.6)}
          <text x={CXb} y={280} textAnchor="middle" fontSize={11} fill="var(--muted)">Σv = λv — same line, longer</text>
        </svg>
      </div>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
        Multiplying by <M>{String.raw`\Sigma`}</M> generally <em>rotates</em> a vector (left). An{" "}
        <strong>eigenvector</strong> is the rare direction that comes back pointing the same way, merely stretched by
        a factor <M>{String.raw`\lambda`}</M> (right). Those unmoved directions are the axes of the covariance
        ellipse — the principal components.
      </figcaption>
    </figure>
  );
}

export default function EigenvectorsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Eigenvectors: the axes of the cloud</>}
        intro={<>We want the direction that maximises <M>{String.raw`v^\top\Sigma v`}</M>. The answer isn&rsquo;t
          found by searching — it&rsquo;s handed to us by the covariance matrix itself, in the form of its
          eigenvectors. This is the mathematical heart of PCA, and it&rsquo;s gentler than it sounds.</>}
      />

      <div className="lesson">
        <h2>What an eigenvector is</h2>
        <p>
          A matrix usually does two things to a vector: it stretches it <em>and</em> rotates it. An{" "}
          <strong>eigenvector</strong> of a matrix <M>{String.raw`\Sigma`}</M> is a special direction that only gets
          stretched, never rotated:
        </p>
        <MathBlock>{String.raw`\Sigma\, v = \lambda\, v.`}</MathBlock>
        <p>
          Apply <M>{String.raw`\Sigma`}</M> to such a <M>v</M> and you get the same <M>v</M> back, scaled by a number{" "}
          <M>{String.raw`\lambda`}</M> called its <strong>eigenvalue</strong>. Most directions get knocked askew;
          eigenvectors hold their line.
        </p>

        <EigenFig />

        <h2>Why the maximum-variance direction is the top eigenvector</h2>
        <p>
          The covariance matrix is symmetric, and symmetric matrices have a beautiful guarantee: their eigenvectors
          are all mutually <strong>orthogonal</strong>, and their eigenvalues are real. Those two facts are exactly
          the two things PCA asked for — perpendicular components, and a real number measuring the spread along each.
          It is no coincidence. Maximising <M>{String.raw`v^\top\Sigma v`}</M> over unit vectors is solved by the
          eigenvector with the largest eigenvalue, and the value it achieves <em>is</em> that eigenvalue:
        </p>
        <MathBlock>{String.raw`\max_{\lVert v\rVert=1} v^\top\Sigma v = \lambda_{\max}, \quad\text{attained at } v = v_{\max}.`}</MathBlock>
        <p>
          So the recipe is complete. Eigen-decompose <M>{String.raw`\Sigma`}</M>, sort the eigenvalue–eigenvector
          pairs from largest eigenvalue to smallest, and you have your ranked components: the eigenvectors are the
          directions (PC1, PC2, …) and the eigenvalues are the variances along them. The{" "}
          <Link href="/learn/pca/rayleigh-and-eigen" style={link}>Rayleigh-quotient page</Link> proves the maximum
          really is <M>{String.raw`\lambda_{\max}`}</M>; for now, trust the picture.
        </p>

        <Callout color={DIM} title={<>The three-line algorithm</>}>
          <strong>1.</strong> Center the data and form <M>{String.raw`\Sigma`}</M>. <strong>2.</strong>{" "}
          Eigen-decompose it into eigenvectors and eigenvalues. <strong>3.</strong> Sort by eigenvalue; the top{" "}
          <M>k</M> eigenvectors are your components. That&rsquo;s classic PCA — though in practice we run the{" "}
          <Link href="/learn/pca/svd" style={link}>SVD</Link> instead, which does the same thing without ever
          forming <M>{String.raw`\Sigma`}</M> and is far more numerically stable. (Wondering <em>how</em> a computer
          actually finds an eigenvector, step by step? That&rsquo;s its own page:{" "}
          <Link href="/learn/pca/computing-the-components" style={link}>power iteration</Link>.)
        </Callout>

        <p>
          The eigenvalues also give you a free gift: because they <em>are</em> the variances, adding them up gives
          the total variance, and each one&rsquo;s share, <M>{String.raw`\lambda_i / \sum_j \lambda_j`}</M>, is the
          fraction of variance that component explains. That ratio is the whole story of{" "}
          <Link href="/learn/pca/scree-and-explained-variance" style={link}>choosing how many components to keep</Link>.
        </p>

        <PrevNext
          prev={{ href: "/learn/pca/centering-and-covariance", label: <>← Centering &amp; the covariance matrix</> }}
          next={{ href: "/learn/pca/projection-and-scores", label: <>Next up · Projection &amp; the new coordinates →</> }}
        />
      </div>
    </article>
  );
}
