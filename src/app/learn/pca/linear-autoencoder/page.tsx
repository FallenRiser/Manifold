import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "PCA is a linear autoencoder — Manifold",
  description:
    "Encode a point to k numbers, decode it back, and minimise reconstruction error: that's an autoencoder, and with linear layers and squared loss its optimum is exactly PCA. This is the bridge from classical reduction to deep learning.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

function AEFig() {
  const box = (x: number, w: number, label: string, sub: string, fill: string) => (
    <g>
      <rect x={x} y={40} width={w} height={70} rx={8} fill={fill} stroke="var(--border-strong)" />
      <text x={x + w / 2} y={70} textAnchor="middle" fontSize={12} fill="var(--ink)" fontWeight={600}>{label}</text>
      <text x={x + w / 2} y={88} textAnchor="middle" fontSize={10} fill="var(--muted)">{sub}</text>
    </g>
  );
  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: 14 }}>
        <svg viewBox="0 0 520 150" style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Encoder maps x to k scores; decoder maps back to x-hat">
          {box(20, 90, "x", "d numbers", "var(--surface)")}
          {box(150, 100, "encode", "Vₖᵀ(x − x̄)", `color-mix(in srgb, ${DIM} 12%, var(--surface))`)}
          {box(290, 70, "z", "k numbers", `color-mix(in srgb, ${DIM} 22%, var(--surface))`)}
          {box(390, 110, "decode", "x̄ + Vₖz", `color-mix(in srgb, ${DIM} 12%, var(--surface))`)}
          <line x1={110} y1={75} x2={148} y2={75} stroke="var(--faint)" strokeWidth={1.5} markerEnd="url(#a2)" />
          <line x1={250} y1={75} x2={288} y2={75} stroke="var(--faint)" strokeWidth={1.5} markerEnd="url(#a2)" />
          <line x1={360} y1={75} x2={388} y2={75} stroke="var(--faint)" strokeWidth={1.5} markerEnd="url(#a2)" />
          <text x={455} y={130} textAnchor="middle" fontSize={11} fill="var(--muted)">→ x̂ (rebuilt)</text>
          <defs><marker id="a2" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L6,3.5 L0,7 z" fill="var(--faint)" /></marker></defs>
        </svg>
      </div>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
        The autoencoder shape: squeeze <M>x</M> through a <M>k</M>-wide bottleneck and expand it back, training to
        make <M>{String.raw`\hat x`}</M> match <M>x</M>. Make both maps linear and the optimum is PCA.
      </figcaption>
    </figure>
  );
}

export default function LinearAutoencoderPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>PCA is a linear autoencoder</>}
        intro={<>The encode-then-decode framing from the projection page has a famous name in deep learning: an
          autoencoder. Seeing PCA as the simplest possible autoencoder is the bridge from this classical method to
          neural dimensionality reduction — and it tells you exactly what a neural net buys you over PCA.</>}
      />

      <div className="lesson">
        <h2>The autoencoder objective</h2>
        <p>
          An <strong>autoencoder</strong> is any pair of maps — an <em>encoder</em> that squeezes a point down to a
          small <em>bottleneck</em> code, and a <em>decoder</em> that expands the code back out — trained to make the
          output resemble the input:
        </p>
        <MathBlock>{String.raw`\min_{\text{enc},\,\text{dec}} \; \sum_i \big\lVert x_i - \text{dec}\big(\text{enc}(x_i)\big)\big\rVert^2.`}</MathBlock>

        <AEFig />

        <p>
          Restrict both maps to be <em>linear</em>, tie the decoder to be the encoder&rsquo;s transpose, and set the
          bottleneck width to <M>k</M>. The objective becomes &ldquo;find the <M>k</M>-dimensional linear
          encode/decode that minimises squared reconstruction error&rdquo; — which is word-for-word PCA&rsquo;s
          objective. So:
        </p>
        <Callout color={DIM} title={<>The equivalence</>}>
          A linear autoencoder with a <M>k</M>-unit bottleneck and squared-error loss has its global optimum at the
          top <M>k</M> principal components. PCA is the closed-form solution to the simplest autoencoder there is —
          no gradient descent required, because <Link href="/learn/pca/low-rank-approximation" style={link}>Eckart–Young</Link>{" "}
          already tells us the answer.
        </Callout>

        <h2>What the nonlinear version buys you</h2>
        <p>
          Now let the encoder and decoder be <em>neural networks</em> with nonlinear activations. The bottleneck can
          now bend: instead of projecting onto a flat subspace, it can wrap the data onto a curved surface. That is
          precisely the limitation of PCA — it only ever fits a <em>flat</em> subspace — and precisely what a deep
          autoencoder relaxes. The cost is that you trade PCA&rsquo;s one-shot, globally-optimal, interpretable
          solution for an iterative, local optimum with far more knobs.
        </p>
        <p>
          This places PCA perfectly on the map: it is the linear floor of a whole tower of methods. Kernel PCA bends
          the space with a kernel; manifold methods bend it with local geometry; autoencoders bend it with learned
          nonlinearities. All of them answer the same question PCA asks — &ldquo;what low-dimensional shape is my
          data really on?&rdquo; — and differ only in whether that shape is allowed to curve. We line them up on the{" "}
          <Link href="/learn/pca/vs-alternatives" style={link}>alternatives page</Link>.
        </p>

        <PrevNext
          prev={{ href: "/learn/pca/low-rank-approximation", label: <>← The best low-rank approximation</> }}
          next={{ href: "/learn/pca/two-objectives", label: <>Next up · Two objectives, one answer →</> }}
        />
      </div>
    </article>
  );
}
