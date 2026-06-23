import Link from "next/link";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Similarity & distance — Manifold",
  description:
    "Clustering rests on one idea: a number for how far apart two points are. Euclidean, Manhattan, and why the choice (and feature scaling) changes everything.",
};

export default function SimilarityAndDistancePage() {
  // a right triangle illustrating Euclidean distance
  const ax = 70, ay = 150, bx = 250, by = 60;
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Similarity &amp; distance
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Every clustering algorithm needs to answer one question: how far apart are these two points?
        Get the distance wrong and every group that follows is wrong too.
      </p>

      <div className="lesson">
        <h2>Distance is the whole game</h2>
        <p>
          &ldquo;Points in the same cluster are close together&rdquo; only means something once
          &ldquo;close&rdquo; is a number. That number is a <strong>distance</strong>, and the most
          common one is the straight-line (Euclidean) distance — the Pythagorean theorem, in any
          number of dimensions.
        </p>
        <MathBlock>{String.raw`d(\mathbf{a}, \mathbf{b}) = \sqrt{\sum_{i=1}^{n} (a_i - b_i)^2}`}</MathBlock>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox="0 0 320 190" style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={320} height={190} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <line x1={ax} y1={ay} x2={bx} y2={ay} stroke="var(--faint)" strokeDasharray="4 3" />
            <line x1={bx} y1={ay} x2={bx} y2={by} stroke="var(--faint)" strokeDasharray="4 3" />
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke="var(--c-clustering)" strokeWidth={2.4} />
            <circle cx={ax} cy={ay} r={4.5} fill="var(--c-regression)" />
            <circle cx={bx} cy={by} r={4.5} fill="var(--c-classification)" />
            <text x={ax - 6} y={ay + 16} fontSize={11} fill="var(--muted)">a</text>
            <text x={bx + 6} y={by} fontSize={11} fill="var(--muted)">b</text>
            <text x={(ax + bx) / 2 - 30} y={ay + 16} fontSize={10} fill="var(--faint)">Δx</text>
            <text x={bx + 6} y={(ay + by) / 2} fontSize={10} fill="var(--faint)">Δy</text>
            <text x={(ax + bx) / 2 - 20} y={(ay + by) / 2 - 6} fontSize={10} fill="var(--c-clustering)">d</text>
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Euclidean distance is just the hypotenuse: <M>{String.raw`d = \sqrt{\Delta x^2 + \Delta y^2}`}</M>.
          </div>
        </div>

        <h2>Other distances</h2>
        <p>
          Euclidean isn&rsquo;t the only choice. <strong>Manhattan</strong> distance sums the
          absolute differences — the blocks-walked distance in a grid city — and is less swayed by a
          single large gap:
        </p>
        <MathBlock>{String.raw`d_{\text{Manhattan}}(\mathbf{a}, \mathbf{b}) = \sum_{i=1}^{n} \lvert a_i - b_i \rvert`}</MathBlock>
        <p>
          Classic k-means is built specifically around <em>squared</em> Euclidean distance — that
          choice is what makes &ldquo;move each centroid to the mean&rdquo; the optimal update, as
          the next pages show. Swap in Manhattan and the mean becomes the median (that variant is
          called k-medians).
        </p>

        <h2>Why scaling matters — a warning</h2>
        <p>
          Distance adds up every feature, so a feature measured in large units drowns out the rest.
          Age in years (0&ndash;100) and income in dollars (0&ndash;100,000) are not comparable: the
          income term alone decides every distance. Before clustering you almost always{" "}
          <Link href="/learn/linear-regression/feature-scaling">standardise the features</Link> so
          each contributes fairly. We give this its own page later in the track.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/the-unsupervised-landscape" style={navLink}>← The unsupervised landscape</Link>
          <Link href="/learn/k-means/distance-metrics-in-depth" style={{ ...navLink, fontWeight: 600 }}>Next up · Distance metrics in depth →</Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
