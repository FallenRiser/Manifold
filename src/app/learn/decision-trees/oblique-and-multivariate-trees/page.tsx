import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";

export const metadata = {
  title: "Oblique & multivariate trees — Manifold",
  description:
    "Standard trees cut straight across one axis, so a diagonal boundary costs a staircase of splits. Oblique trees split on linear combinations of features — one clean cut — but pay for it in interpretability and training cost.",
};

const TREES = "var(--c-trees)";

export default function ObliqueTreesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Oblique &amp; multivariate trees</>}
        intro={<>
          Every split you&rsquo;ve seen tests one feature against a threshold — a cut perpendicular to an axis.
          That&rsquo;s a real limitation, and it has a natural fix that turns out to be more trouble than
          it&rsquo;s usually worth. Understanding why is understanding what trees are really good at.
        </>}
      />

      <div className="lesson">
        <h2>The cost of cutting straight</h2>
        <p>
          An axis-aligned split can only draw horizontal and vertical lines. When the true boundary runs at an
          angle — say, &ldquo;approve if income minus debt is high enough&rdquo; — a standard tree has to
          approximate that diagonal with a <strong>staircase</strong> of many small cuts, each fixing a little
          more of the error. You saw exactly this on the <Link href="/learn/decision-trees" style={link}>opening
          lab</Link>&rsquo;s Diagonal dataset: dozens of leaves to fake a single slanted line.
        </p>

        <figure style={{ margin: "1.4rem 0" }}>
          <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 12px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <StaircaseFig />
              <ObliqueFig />
            </div>
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              Same diagonal boundary. <strong style={{ color: "var(--c-trees)" }}>Left:</strong> an axis-aligned
              tree needs a staircase of cuts. <strong style={{ color: "var(--c-trees)" }}>Right:</strong> one
              oblique split <M>{String.raw`w_1 x_1 + w_2 x_2 \le t`}</M> does it cleanly.
            </div>
          </div>
        </figure>

        <h2>Oblique splits: cut in any direction</h2>
        <p>
          An <strong>oblique</strong> (or multivariate) tree lifts the one-feature restriction. Each split tests
          a <em>linear combination</em> of features against a threshold —{" "}
          <M>{String.raw`w_1 x_1 + w_2 x_2 + \cdots \le t`}</M> — so a single node can draw a boundary at any
          angle. Algorithms like <strong>OC1</strong> and <strong>CART-LC</strong> search for good hyperplanes
          at each node; the diagonal that took a dozen axis-aligned leaves becomes one clean cut.
        </p>

        <h2>Why they&rsquo;re rarely the answer</h2>
        <p>Oblique power comes at a steep price on three fronts:</p>
        <ul style={ul}>
          <li><strong>Interpretability evaporates.</strong> &ldquo;<code>petal length ≤ 2.45</code>&rdquo; is a
            sentence anyone reads. &ldquo;<code>0.31·income − 0.72·age + 0.14·balance ≤ 5.1</code>&rdquo; is not.
            The single best thing about a tree — the readable flowchart — is gone.</li>
          <li><strong>The search gets hard.</strong> Finding the best <em>threshold</em> on one feature is a
            cheap sorted scan; finding the best <em>hyperplane</em> over many features is a genuine optimisation
            at every node, far slower and often non-convex, so oblique methods lean on heuristics.</li>
          <li><strong>More capacity, more overfitting.</strong> A node that can point any direction fits noise
            more eagerly, so oblique trees need even more careful regularisation.</li>
        </ul>

        <Callout color={TREES} title={<>Ensembles solve the diagonal more cheaply</>}>
          Here&rsquo;s the punchline that explains why oblique trees stay niche: you rarely need them. A{" "}
          <Link href="/learn/random-forests" style={link}>random forest</Link> of ordinary axis-aligned trees
          already approximates smooth, diagonal boundaries well — the averaged staircases blur into something
          effectively oblique — while keeping the cheap split search and adding robustness. Why solve the angle
          problem with an expensive, opaque single tree when averaging cheap ones does it for free? Oblique
          trees live on mostly inside specialised ensembles (rotation forests, oblique random forests) where the
          extra power occasionally pays off.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/decision-trees/the-algorithm-family", label: <>← The algorithm family</> }}
          next={{ href: "/learn/decision-trees/class-weights-and-cost-sensitive", label: <>Next up · Class weights & cost-sensitive trees →</> }}
        />
      </div>
    </article>
  );
}

// static figures — module-scope constants, rounded coords → SSR-safe
const S = 150, P = 12;
const gp = (v: number) => Math.round((P + v * (S - 2 * P)) * 100) / 100;
// deterministic points split by the diagonal x2 = x1
const PTS = (() => {
  let seed = 5;
  const r = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const out: { x: number; y: number; c: 0 | 1 }[] = [];
  for (let i = 0; i < 40; i++) { const x = r(), y = r(); out.push({ x, y, c: (y > x ? 1 : 0) }); }
  return out;
})();
const COL = ["var(--c-regression)", "var(--c-classification)"];

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: 180, display: "block" }} role="img" aria-label="diagonal boundary approximated two ways">
      {children}
      {PTS.map((p, i) => (
        <circle key={i} cx={gp(p.x)} cy={gp(1 - p.y)} r={3} fill={COL[p.c]} stroke="var(--surface)" strokeWidth={0.7} />
      ))}
    </svg>
  );
}
function StaircaseFig() {
  // draw a staircase along the diagonal
  const steps = 6;
  const segs: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    segs.push(`M ${gp(t)} ${gp(1 - t)} L ${gp(t)} ${gp(1 - (t + 1 / steps))} L ${gp(t + 1 / steps)} ${gp(1 - (t + 1 / steps))}`);
  }
  return <Frame><path d={segs.join(" ")} fill="none" stroke="var(--c-trees)" strokeWidth={1.5} /></Frame>;
}
function ObliqueFig() {
  return <Frame><line x1={gp(0)} y1={gp(1)} x2={gp(1)} y2={gp(0)} stroke="var(--c-trees)" strokeWidth={2} /></Frame>;
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
