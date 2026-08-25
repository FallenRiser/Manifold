import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "When PCA fails — Manifold",
  description:
    "PCA is linear, variance-driven, and Gaussian-flavoured. Curved structure, outliers, and the gap between variance and importance are the four ways it quietly gives you a bad answer — and each points to a specific fix.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// deterministic concentric-rings figure — structure PCA cannot capture
function RingsFig() {
  const CX = 130, CY = 130, R = 130;
  const pts: [number, number, number][] = [];
  let seed = 42;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * 2 * Math.PI, r = 30 + rnd() * 6;
    pts.push([CX + Math.cos(a) * r, CY - Math.sin(a) * r, 0]);
  }
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * 2 * Math.PI, r = 90 + rnd() * 7;
    pts.push([CX + Math.cos(a) * r, CY - Math.sin(a) * r, 1]);
  }
  void R;
  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: 14 }}>
        <svg viewBox="0 0 260 260" style={{ width: "100%", maxWidth: 300, height: "auto", display: "block", margin: "0 auto" }} role="img" aria-label="Two concentric rings; PC1 through the middle cannot separate them">
          <line x1={0} y1={CY} x2={260} y2={CY} stroke={DIM} strokeWidth={2} />
          <text x={252} y={CY - 6} textAnchor="end" fontSize={10.5} fill={DIM}>PC1</text>
          {pts.map(([x, y, c], i) => (
            <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={3} fill={c === 0 ? "var(--ink)" : "var(--brand-3)"} fillOpacity={0.8} />
          ))}
        </svg>
      </div>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
        An inner and an outer ring — obviously two groups. But every direction through the centre has the <em>same</em>
        variance, so PCA&rsquo;s components are arbitrary and projecting onto PC1 blends the rings hopelessly. The
        structure is real; it&rsquo;s just not linear.
      </figcaption>
    </figure>
  );
}

export default function WhenPcaFailsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>When PCA fails</>}
        intro={<>PCA is fast, closed-form, and optimal — for the specific job it does. Ask it to do a different job and
          it fails quietly, handing you a confident wrong answer. Knowing its four failure modes is what separates
          using PCA from misusing it.</>}
      />

      <div className="lesson">
        <h2>1. The structure is curved</h2>
        <p>
          PCA can only ever fit a <em>flat</em> subspace. When the data lies on a curved surface — a spiral, a swiss
          roll, two concentric rings — no straight axis captures the shape, and PCA either mangles it or reports that
          every direction is equally good.
        </p>

        <RingsFig />

        <p>
          This is the most important limitation, and it names the rest of the family: <strong>kernel PCA</strong>
          bends the space with a kernel before projecting; <strong>manifold methods</strong> (Isomap, LLE, Laplacian
          eigenmaps) follow the surface using local neighbourhoods; <strong>t-SNE and UMAP</strong> throw out global
          geometry entirely to preserve local neighbourhoods for visualisation. All exist because real data curves.
        </p>

        <h2>2. Variance isn&rsquo;t importance</h2>
        <p>
          PCA keeps the highest-variance directions, but for a <em>supervised</em> task the directions that matter are
          the ones that separate the classes — and those can have small variance. A feature that varies wildly but
          says nothing about the label will dominate PC1; the subtle feature that actually predicts the label may sit
          in a discarded component. When you have labels and a prediction goal, PCA is not the right reducer —
          <Link href="/learn/pca/vs-alternatives" style={link}> LDA</Link> optimises separation instead, and{" "}
          <Link href="/learn/pca/choosing-k" style={link}>cross-validating <M>k</M></Link> guards against dropping a
          low-variance-but-useful direction.
        </p>

        <h2>3. Outliers hijack the components</h2>
        <p>
          Variance is a squared quantity, so a single wild point pulls a component toward itself the way an outlier
          drags a <Link href="/learn/linear-regression/why-squared-error" style={link}>least-squares line</Link>. One
          data-entry error in the thousands can rotate PC1 to point at it. Screen for outliers first, or use a{" "}
          <strong>robust PCA</strong> variant that separates a low-rank part from a sparse outlier part.
        </p>

        <h2>4. The data is non-Gaussian or multimodal</h2>
        <p>
          PCA summarises a cloud by its mean and covariance — the full description only of a Gaussian. If the data is
          several distinct clusters, or heavy-tailed, or its interesting structure is in higher moments (independent
          but uncorrelated signals), covariance misses it. That&rsquo;s the territory of clustering, mixture models,
          and independent component analysis.
        </p>

        <Callout color={DIM} title={<>The honest summary</>}>
          Reach for PCA when the data is roughly a single elliptical cloud, features are correlated, the signal is
          high-variance, and you want a fast, interpretable, linear reduction. Be suspicious when the structure is
          curved, the goal is supervised, outliers lurk, or the data is clumpy. PCA failing isn&rsquo;t a bug —
          it&rsquo;s the signpost telling you which method to reach for next.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/pca/interpreting-loadings", label: <>← Reading components: loadings &amp; biplots</> }}
          next={{ href: "/learn/pca/vs-alternatives", label: <>Next up · PCA vs LDA, t-SNE &amp; autoencoders →</> }}
        />
      </div>
    </article>
  );
}
