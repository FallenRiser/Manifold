import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Two objectives, one answer — Manifold",
  description:
    "PCA is introduced two different ways — maximise variance, or minimise reconstruction error — and students wonder which is 'really' it. A one-line Pythagorean argument shows they are the same objective, always.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

function PythFig() {
  const CX = 150, CY = 210;
  const ang = -32 * Math.PI / 180;
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const px = 300, py = 60; // the data point
  // projection of (px,py) relative to CX,CY onto u
  const dx = px - CX, dy = -(py - CY);
  const t = dx * ux + dy * uy;
  const projx = CX + t * ux, projy = CY - t * uy;
  const f = (n: number) => n.toFixed(1);
  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: 14 }}>
        <svg viewBox="0 0 420 260" style={{ width: "100%", maxWidth: 440, height: "auto", display: "block", margin: "0 auto" }} role="img" aria-label="Right triangle: distance to origin squared equals projection squared plus residual squared">
          {/* the component line */}
          <line x1={f(CX - ux * 130)} y1={f(CY + uy * 130)} x2={f(CX + ux * 160)} y2={f(CY - uy * 160)} stroke={DIM} strokeWidth={2} />
          <text x={f(CX + ux * 160)} y={f(CY - uy * 160 - 6)} fontSize={11} fill={DIM}>PC direction</text>
          {/* hypotenuse: origin to point */}
          <line x1={CX} y1={CY} x2={px} y2={py} stroke="var(--ink)" strokeWidth={2} />
          {/* projection (captured) along line */}
          <line x1={CX} y1={CY} x2={f(projx)} y2={f(projy)} stroke={DIM} strokeWidth={4} strokeOpacity={0.5} />
          {/* residual */}
          <line x1={f(projx)} y1={f(projy)} x2={px} y2={py} stroke="var(--brand-3)" strokeWidth={2.4} strokeDasharray="4 3" />
          <circle cx={CX} cy={CY} r={4} fill="var(--ink)" />
          <circle cx={px} cy={py} r={5} fill="var(--ink)" />
          <text x={CX - 12} y={CY + 16} fontSize={11} fill="var(--muted)">mean</text>
          <text x={px + 6} y={py} fontSize={11} fill="var(--ink)">point xᵢ</text>
          <text x={f((CX + projx) / 2)} y={f((CY + projy) / 2 + 16)} fontSize={10.5} fill={DIM}>captured (score)</text>
          <text x={f((projx + px) / 2 + 6)} y={f((projy + py) / 2)} fontSize={10.5} fill="var(--brand-3)">residual</text>
        </svg>
      </div>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
        For each point, its distance from the mean (black) is the hypotenuse of a right triangle whose legs are the
        captured projection (violet) and the perpendicular residual (gold). Pythagoras ties the three together —
        and summing over all points is the whole theorem.
      </figcaption>
    </figure>
  );
}

export default function TwoObjectivesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Two objectives, one answer</>}
        intro={<>You&rsquo;ve now seen PCA defined two ways: maximise the variance you keep, and minimise the error you
          leave behind. It&rsquo;s natural to ask which is the &ldquo;true&rdquo; definition. The answer is that they
          are provably the same — and the proof is a single right triangle.</>}
      />

      <div className="lesson">
        <h2>Pythagoras, summed over the dataset</h2>
        <p>
          Take one centered point <M>{String.raw`x_i`}</M> and a candidate unit direction <M>v</M>. Drop a
          perpendicular from the point to the line through the mean. That splits the point&rsquo;s displacement into
          two perpendicular pieces: the part <em>along</em> the line (its projection, the score) and the part{" "}
          <em>off</em> the line (the residual). Because they meet at a right angle, Pythagoras applies exactly:
        </p>
        <MathBlock>{String.raw`\underbrace{\lVert x_i\rVert^2}_{\text{fixed}} \;=\; \underbrace{(v^\top x_i)^2}_{\text{captured}} \;+\; \underbrace{\lVert x_i - (v^\top x_i)v\rVert^2}_{\text{residual}}.`}</MathBlock>

        <PythFig />

        <p>
          Now sum over every point. The left side, <M>{String.raw`\sum_i \lVert x_i\rVert^2`}</M>, is the total
          variance of the data — a constant that <em>does not depend on <M>v</M></em>. So:
        </p>
        <MathBlock>{String.raw`\underbrace{\sum_i \lVert x_i\rVert^2}_{\text{constant}} \;=\; \underbrace{\sum_i (v^\top x_i)^2}_{\text{variance captured}} \;+\; \underbrace{\sum_i \lVert x_i - \hat x_i\rVert^2}_{\text{reconstruction error}}.`}</MathBlock>

        <Callout color={DIM} title={<>The duality</>}>
          Captured variance + reconstruction error = a constant. Push one up and the other must come down by the same
          amount. Therefore <strong>maximising captured variance is identical to minimising reconstruction
          error</strong> — not approximately, not usually, but exactly, for every choice of <M>v</M> and every <M>k</M>.
          They are one objective described from two ends.
        </Callout>

        <p>
          This is why it never mattered which definition your textbook led with. It&rsquo;s also the constant-sum you
          watched in the very first <Link href="/learn/pca" style={link}>projection lab</Link>: the violet bar and the
          gold bar always added to the full total, because they are the two legs of this triangle summed over the
          cloud. The rotation that lengthens one shortens the other, and PC1 is where the captured leg is longest.
        </p>

        <p>
          What remains is to prove that the maximiser is specifically the top eigenvector, and that the maximum value
          is <M>{String.raw`\lambda_{\max}`}</M>. That&rsquo;s the <Link href="/learn/pca/rayleigh-and-eigen" style={link}>Rayleigh
          quotient</Link>, next.
        </p>

        <PrevNext
          prev={{ href: "/learn/pca/linear-autoencoder", label: <>← PCA is a linear autoencoder</> }}
          next={{ href: "/learn/pca/rayleigh-and-eigen", label: <>Next up · The Rayleigh quotient &amp; why eigenvectors →</> }}
        />
      </div>
    </article>
  );
}
