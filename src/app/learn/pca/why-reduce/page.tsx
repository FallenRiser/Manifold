import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Pca3DLab } from "@/components/labs/Pca3DLab";

export const metadata = {
  title: "Why reduce dimensions at all? — Manifold",
  description:
    "High-dimensional data is hard to see, expensive to store, noisy, and hostile to many algorithms. Dimensionality reduction attacks all four problems at once — and it works because real features are rarely independent.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };

// analytic curse-of-dimensionality figure: fraction of a unit cube's volume
// lying within 0.1 of its surface = 1 - 0.8^d. No dataset needed — pure geometry.
const CURSE: [number, number][] = [[1, 0.2], [2, 0.36], [3, 0.49], [5, 0.67], [10, 0.89], [20, 0.99], [50, 1.0]];

function CurseFig() {
  const VW = 520, VH = 210, PAD = { l: 44, r: 14, t: 14, b: 34 };
  const X0 = PAD.l, X1 = VW - PAD.r, Y0 = VH - PAD.b, Y1 = PAD.t;
  const bw = (X1 - X0) / CURSE.length;
  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "14px 12px 8px" }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Fraction of a cube's volume near its surface, versus dimension">
          {[0, 0.5, 1].map((g) => (
            <g key={g}>
              <line x1={X0} y1={Y0 - g * (Y0 - Y1)} x2={X1} y2={Y0 - g * (Y0 - Y1)} stroke="var(--border)" strokeWidth={1} />
              <text x={X0 - 6} y={Y0 - g * (Y0 - Y1) + 3} fontSize={9.5} fill="var(--faint)" textAnchor="end">{Math.round(g * 100)}%</text>
            </g>
          ))}
          {CURSE.map(([d, v], i) => (
            <g key={d}>
              <rect x={X0 + i * bw + 6} y={Y0 - v * (Y0 - Y1)} width={bw - 12} height={v * (Y0 - Y1)} rx={2} fill={DIM} fillOpacity={0.8} />
              <text x={X0 + i * bw + bw / 2} y={VH - 20} fontSize={10} fill="var(--muted)" textAnchor="middle">{d}</text>
            </g>
          ))}
          <text x={(X0 + X1) / 2} y={VH - 6} fontSize={10.5} fill="var(--faint)" textAnchor="middle">number of dimensions</text>
        </svg>
      </div>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
        Fraction of a unit cube&rsquo;s volume within 0.1 of its surface, <M>{String.raw`1-0.8^{\,d}`}</M>. By 10
        dimensions almost <strong>90%</strong> of the space is &ldquo;near the edge&rdquo;; the roomy middle where
        you&rsquo;d expect data to sit is nearly empty. High-dimensional space is mostly corners.
      </figcaption>
    </figure>
  );
}

export default function WhyReducePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 1 · intuition", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Why reduce dimensions at all?</>}
        intro={<>Before the how, the why. Adding columns feels like adding information, and sometimes it is. But past a
          point, extra dimensions cost you more than they pay — in what you can see, what you can store, how much
          noise you carry, and whether your models work at all.</>}
      />

      <div className="lesson">
        <h2>Four problems, one fix</h2>
        <ul style={ul}>
          <li><strong>You can&rsquo;t see it.</strong> Humans read two, maybe three dimensions. A dataset with 30 features is invisible until you can project it down to a plane you can actually plot.</li>
          <li><strong>It&rsquo;s expensive.</strong> Storing and computing over thousands of features — millions of images, each a vector of pixels — is slow and memory-hungry. Fewer numbers per example is cheaper everywhere downstream.</li>
          <li><strong>It&rsquo;s noisy.</strong> Much of the fine-grained variation in real data is measurement noise. That noise tends to live in the directions of <em>least</em> structure — exactly the ones reduction throws away.</li>
          <li><strong>It breaks models.</strong> Nearest neighbours, clustering, and many estimators degrade as dimensions pile up. This is the <Link href="/learn/k-nearest-neighbors/the-curse-of-dimensionality" style={link}>curse of dimensionality</Link>.</li>
        </ul>

        <h2>The curse, made concrete</h2>
        <p>
          The curse isn&rsquo;t hand-waving; it&rsquo;s geometry. In high dimensions almost all of the volume of a
          region sits in a thin shell near its boundary, so points spread to the edges and the distances between
          them all start to look the same. When every pair of points is roughly equidistant, &ldquo;nearest&rdquo;
          stops meaning anything — and methods built on distance quietly stop working.
        </p>

        <CurseFig />

        <h2>Why it&rsquo;s even possible</h2>
        <p>
          If your 50 features were genuinely 50 independent knobs, you couldn&rsquo;t compress them without losing
          something. The reason reduction works is that <strong>real features are correlated</strong>. Height and
          weight move together; a house&rsquo;s square footage, room count, and price move together; a face
          photo&rsquo;s neighbouring pixels are nearly identical. All that redundancy means the data doesn&rsquo;t
          fill its 50-dimensional box — it clings to a much lower-dimensional surface inside it. The technical name
          for &ldquo;the true number of directions the data actually uses&rdquo; is its <strong>intrinsic
          dimension</strong>, and it is usually far smaller than the number of columns.
        </p>

        <p>
          You can see this directly. The cloud below <em>lives</em> in three dimensions — three measured features —
          but the points barely leave a single tilted plane; the third direction is almost pure noise. Rotate it to
          catch the flatness edge-on, then drag <strong>flatten</strong> to watch PCA fold the 3-D cloud down onto that
          plane. That fold — three numbers per point down to two, losing only what the thin direction held —{" "}
          <em>is</em> dimensionality reduction.
        </p>

        <PredictPrompt
          accent={DIM}
          prompt={<>Three real features, so three dimensions of &ldquo;spread.&rdquo; How much of the total variance do
            you think the best flat plane (two directions) can keep?</>}
          options={["About half", "Roughly 98%", "You need all three"]}
        />

        <LabFrame
          accent={DIM}
          tryThis={<>Rotate until the cloud looks like a thin sheet seen edge-on — the gold sticks show how far each
            point sits off the fitted plane. Then drag <strong>flatten</strong> to 100% and read &ldquo;plane
            keeps.&rdquo;</>}
          insight={<>The plane keeps ~98% of the variance using two directions instead of three, because the third
            eigenvalue is tiny (~1.9%). The data was &ldquo;3-D&rdquo; only on paper; its intrinsic dimension is 2, and
            PCA found the plane it actually lives on.</>}
        >
          <Pca3DLab />
        </LabFrame>

        <Callout color={DIM} title={<>The bet PCA makes</>}>
          PCA bets that the intrinsic dimension is small <em>and</em> that the important directions are the
          high-variance ones. When features are correlated and the signal is bigger than the noise — which is most
          of the time — that bet pays off. The rest of this track is about how it finds those directions, and{" "}
          <Link href="/learn/pca/when-pca-fails" style={link}>when the bet goes wrong</Link>.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/pca", label: <>← Fewer dimensions, same story</> }}
          next={{ href: "/learn/pca/maximize-variance", label: <>Next up · The direction of most spread →</> }}
        />
      </div>
    </article>
  );
}
