import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The direction of most spread — Manifold",
  description:
    "PCA's objective in one line: find the direction of maximum variance, then the next-most orthogonal to it, and so on. Here's why 'most variance' is the right thing to maximise, and how the components get ranked.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

function RankedAxesFig() {
  const VW = 460, VH = 300, CX = 200, CY = 150;
  const ang = -28 * Math.PI / 180;
  const ux = Math.cos(ang), uy = Math.sin(ang), vx = -Math.sin(ang), vy = Math.cos(ang);
  const a = 120, b = 46;
  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: 14 }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="A data ellipse with its two ranked principal axes">
          <ellipse cx={CX} cy={CY} rx={a} ry={b} transform={`rotate(${(ang * 180 / Math.PI).toFixed(1)} ${CX} ${CY})`} fill={`color-mix(in srgb, ${DIM} 12%, transparent)`} stroke={DIM} strokeWidth={1.4} strokeOpacity={0.6} />
          <line x1={(CX - ux * a).toFixed(1)} y1={(CY + uy * a).toFixed(1)} x2={(CX + ux * a).toFixed(1)} y2={(CY - uy * a).toFixed(1)} stroke="var(--ink)" strokeWidth={2.6} />
          <line x1={(CX - vx * b).toFixed(1)} y1={(CY + vy * b).toFixed(1)} x2={(CX + vx * b).toFixed(1)} y2={(CY - vy * b).toFixed(1)} stroke="var(--brand-3)" strokeWidth={2.6} />
          <text x={(CX + ux * a + 8).toFixed(1)} y={(CY - uy * a).toFixed(1)} fontSize={12} fill="var(--ink)" fontWeight={600}>PC1 · 85%</text>
          <text x={(CX + vx * b + 6).toFixed(1)} y={(CY - vy * b - 4).toFixed(1)} fontSize={12} fill="var(--brand-3)" fontWeight={600}>PC2 · 15%</text>
        </svg>
      </div>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
        The components are the axes of the data&rsquo;s ellipse, ranked by variance. PC1 (the long axis) carries the
        most spread; PC2 is the most spread that is left <em>and</em> perpendicular to PC1. Drop PC2 and you keep 85%
        of the variation in a single number per point.
      </figcaption>
    </figure>
  );
}

export default function MaximizeVariancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 1 · intuition", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>The direction of most spread</>}
        intro={<>You felt it in the projection lab: some directions keep the data spread out, others crush it into a
          clump. PCA turns that instinct into an objective — <em>maximise variance</em> — and then repeats it,
          building a ranked list of directions. This page pins down why variance is the right target.</>}
      />

      <div className="lesson">
        <h2>Variance is preserved information</h2>
        <p>
          When you project points onto a line, two points that were far apart can land on top of each other — you
          lose the ability to tell them apart. The <em>spread</em> of the projected points, their variance, measures
          exactly how much distinguishing information survived the squash. A high-variance direction keeps points
          separated; a low-variance direction throws them into a pile. So &ldquo;keep the most information&rdquo;
          and &ldquo;keep the most variance&rdquo; are the same instruction.
        </p>

        <p>
          Write a candidate direction as a unit vector <M>{String.raw`v`}</M>. The projection of a centred point{" "}
          <M>{String.raw`x`}</M> onto it is the number <M>{String.raw`v^\top x`}</M>, and the variance of those
          projections across the dataset is
        </p>
        <MathBlock>{String.raw`\operatorname{Var}(v^\top x) = v^\top \Sigma\, v,`}</MathBlock>
        <p>
          where <M>{String.raw`\Sigma`}</M> is the <Link href="/learn/pca/centering-and-covariance" style={link}>covariance
          matrix</Link> of the data. PC1 is simply the unit vector that makes this as large as possible:
        </p>
        <MathBlock>{String.raw`v_1 = \operatorname*{arg\,max}_{\lVert v\rVert = 1}\; v^\top \Sigma\, v.`}</MathBlock>
        <p>
          We restrict to <em>unit</em> vectors because otherwise you could cheat by making <M>v</M> longer; the
          direction is what matters, not its length. That constraint turns out to make the answer an eigenvector —
          the story of the <Link href="/learn/pca/eigenvectors" style={link}>next chapter</Link>.
        </p>

        <h2>Ranking the rest</h2>
        <p>
          One direction isn&rsquo;t enough for data with more than one dimension of structure. PCA is greedy: after
          PC1, it looks for the direction of most <em>remaining</em> variance that is <strong>orthogonal</strong> to
          PC1 — that&rsquo;s PC2. Then the most remaining variance orthogonal to both — PC3 — and so on. The
          orthogonality matters: it guarantees the components don&rsquo;t re-describe the same variation twice, so
          each new component adds genuinely new information.
        </p>

        <RankedAxesFig />

        <p>
          The result is a full set of axes, one per original dimension, but now <em>ranked</em> by importance. Keep
          the first <M>k</M> and you have the best flat <M>k</M>-dimensional summary of your data — best in the
          precise sense that no other <M>k</M> directions capture more variance, which the{" "}
          <Link href="/learn/pca/low-rank-approximation" style={link}>Eckart–Young theorem</Link> makes exact.
        </p>

        <Callout color={DIM} title={<>Why not just keep the highest-variance original columns?</>}>
          Because the best direction is almost never one of your columns — it&rsquo;s usually a <em>blend</em> of
          them. Height alone and weight alone each vary a bit; &ldquo;overall size,&rdquo; the diagonal combining
          them, varies much more. PCA is allowed to invent that diagonal. Feature <em>selection</em> can only pick
          from the axes you started with; PCA rotates to better ones.
        </Callout>

        <Quiz
          accent={DIM}
          questions={[
            {
              q: <>Why does PCA maximise the <em>variance</em> of the projected points?</>,
              options: [
                "Variance is easy to compute",
                "Spread measures how much distinguishing information survives the projection",
                "High variance always means low noise",
              ],
              answer: 1,
              explain: <>A projection that spreads points out keeps them distinguishable; one that clumps them together destroys information. Variance is that spread.</>,
            },
            {
              q: <>What makes PC2 different from just &ldquo;the second-highest-variance direction&rdquo;?</>,
              options: [
                "It must be orthogonal to PC1",
                "It must be one of the original features",
                "It has negative variance",
              ],
              answer: 0,
              explain: <>PC2 is the direction of most remaining variance that is perpendicular to PC1, so it captures new structure rather than re-describing PC1&rsquo;s.</>,
            },
            {
              q: <>Why restrict the search to unit vectors <M>{String.raw`\lVert v\rVert=1`}</M>?</>,
              options: [
                "To keep the math linear",
                "Otherwise you could inflate v^⊤Σv just by making v longer, which says nothing about direction",
                "Unit vectors are the only eigenvectors",
              ],
              answer: 1,
              explain: <>The quantity <M>{String.raw`v^\top\Sigma v`}</M> scales with <M>{String.raw`\lVert v\rVert^2`}</M>, so without the constraint the &ldquo;best&rdquo; vector would just be infinitely long. We care only about direction.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/pca/why-reduce", label: <>← Why reduce dimensions at all?</> }}
          next={{ href: "/learn/pca/centering-and-covariance", label: <>Next up · Centering &amp; the covariance matrix →</> }}
        />
      </div>
    </article>
  );
}
