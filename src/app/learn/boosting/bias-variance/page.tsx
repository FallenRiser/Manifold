import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Bias, variance & why it isn't bagging — Manifold",
  description:
    "Bagging and boosting attack opposite terms of the error. A forest averages low-bias, high-variance trees to kill variance; boosting sums high-bias, low-variance trees to kill bias. That single difference explains every practical contrast between them.",
};

const TREES = "var(--c-trees)";

export default function BiasVariancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Bias, variance &amp; why it isn&rsquo;t bagging</>}
        intro={<>
          The forest track built its whole theory on the <Link href="/learn/random-forests/why-averaging-works" style={link}>variance
          of a correlated average</Link>. Boosting lives on the other side of the bias–variance decomposition.
          Holding both pictures at once is what makes you fluent in ensembles.
        </>}
      />

      <div className="lesson">
        <h2>The decomposition, as a lens</h2>
        <p>
          Expected test error splits into three parts: <strong>bias²</strong> (how wrong the average model is),{" "}
          <strong>variance</strong> (how much the model wobbles across training sets), and irreducible noise. An
          ensemble can only help by shrinking one of the first two — and bagging and boosting each target a
          different one, starting from opposite base learners.
        </p>

        <figure style={{ margin: "1.6rem 0" }}>
          <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "18px 12px 12px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <DartFig mode="bag" />
              <DartFig mode="boost" />
            </div>
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 8, maxWidth: 540, marginInline: "auto" }}>
              <strong style={{ color: TREES }}>Bagging</strong> starts from scattered but centred shots (low bias,
              high variance) and <em>averages</em> them to a tight cluster — it kills{" "}
              <strong>variance</strong>. <strong style={{ color: TREES }}>Boosting</strong> starts from a tight but
              off-target cluster (high bias, low variance) and <em>marches it</em> onto the bullseye — it kills{" "}
              <strong>bias</strong>.
            </div>
          </div>
        </figure>

        <Callout color={TREES} title={<>The core contrast</>}>
          <table style={tbl}>
            <thead><tr><th style={th}></th><th style={th}>Random forest (bagging)</th><th style={th}>Gradient boosting</th></tr></thead>
            <tbody>
              <tr><td style={tdh}>Base learner</td><td style={td}>Deep tree — <strong>low bias, high variance</strong></td><td style={td}>Shallow tree — <strong>high bias, low variance</strong></td></tr>
              <tr><td style={tdh}>Combination</td><td style={td}>Average (parallel)</td><td style={td}>Add sequentially</td></tr>
              <tr><td style={tdh}>Attacks</td><td style={td}><strong>Variance</strong></td><td style={td}><strong>Bias</strong></td></tr>
              <tr><td style={tdh}>Trees are</td><td style={td}>Independent</td><td style={td}>Dependent (each fixes the last)</td></tr>
              <tr><td style={tdh}>More trees</td><td style={td}>Never overfits — plateaus</td><td style={td}><strong>Can</strong> overfit — needs early stopping</td></tr>
              <tr><td style={tdh}>Parallelism</td><td style={td}>Embarrassingly parallel</td><td style={td}>Inherently sequential</td></tr>
            </tbody>
          </table>
        </Callout>

        <h2>Why boosting reduces bias</h2>
        <p>
          A single shallow tree <em>underfits</em> — it is too rigid to capture the target, so it has high bias
          and low variance. Boosting adds a correction aimed squarely at the current error, so each round the
          ensemble represents a richer function and the bias falls. The variance stays modest because each
          contribution is small (shrunk by the <Link href="/learn/boosting/shrinkage" style={link}>learning
          rate</Link>) and each tree is weak. Boosting turns a high-bias learner into a low-bias ensemble — the
          mirror image of what a forest does.
        </p>

        <h2>Why bagging can&rsquo;t reduce bias (and boosting can&rsquo;t just average)</h2>
        <p>
          Averaging independent trees leaves the bias <em>untouched</em>: the mean of many unbiased-but-wobbly
          estimates has the same expected value, only less spread. So a forest of shallow, biased stumps would
          just be a stable, still-biased model — useless. That is precisely why forests use <em>deep</em> trees:
          they need the low bias, and averaging supplies the missing stability. Symmetrically, boosting cannot
          reach its low bias by averaging — it needs the <em>sequential</em> correction, each tree conditioned on
          the residual left by all the others.
        </p>

        <h2>Everything practical follows from this one difference</h2>
        <ul style={ul}>
          <li><strong>Robustness vs peak accuracy.</strong> A forest&rsquo;s variance-reduction is stable and hard to break — a superb default. Boosting&rsquo;s bias-reduction reaches lower error but must be tuned and stopped, or it overfits.</li>
          <li><strong>Depth of base trees.</strong> Deep for forests (need low bias), shallow for boosting (need low variance per step). Reading a config, the tree depth alone tells you which philosophy you&rsquo;re in.</li>
          <li><strong>Training cost &amp; parallelism.</strong> Forests fit all trees at once across cores; boosting must build trees in sequence — the <Link href="/learn/boosting/case-a-tabular" style={link}>speed gap</Link> you measured.</li>
          <li><strong>Noise tolerance.</strong> Averaging is forgiving of label noise; boosting&rsquo;s relentless error-chasing can <Link href="/learn/boosting/margins" style={link}>amplify</Link> it — hence gentler losses and early stopping.</li>
        </ul>

        <p>
          Hold the two side by side and the whole family snaps into place: <strong>bagging averages to kill
          variance; boosting adds to kill bias.</strong> Same decision-tree brick, opposite failure of a single
          tree repaired, opposite engineering trade-offs. If you remember one sentence from the Trees &amp;
          ensembles family, make it that one.
        </p>

        <Quiz
          title="Can you answer these?"
          accent={TREES}
          questions={[
            {
              q: <>Why do random forests use deep trees while gradient boosting uses shallow ones?</>,
              options: [
                "Convention with no real reason",
                "Forests need low-bias base learners (averaging fixes their variance); boosting needs low-variance base learners (adding fixes their bias)",
                "Deep trees are always better but too slow for boosting",
              ],
              answer: 1,
              explain: <>Averaging can't lower bias, so forests supply low bias via deep trees. Sequential correction lowers bias, so boosting keeps each tree weak/shallow to control variance.</>,
            },
            {
              q: <>A colleague bags 500 depth-2 stumps and is disappointed it underperforms. Why?</>,
              options: [
                "Too few trees",
                "Averaging leaves bias untouched — stumps are high-bias, so the average is stable but still biased",
                "Stumps have too much variance",
              ],
              answer: 1,
              explain: <>Bagging reduces variance, not bias. A committee of high-bias stumps stays biased. To exploit weak learners you must boost them, not bag them.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/boosting/functional-gradient", label: <>← Boosting as functional gradient descent</> }}
          next={{ href: "/learn/boosting/interpretation", label: <>Next up · Interpreting a boosted model →</> }}
        />
      </div>
    </article>
  );
}

// Dartboard contrast: bagging averages a scattered/centred spread; boosting marches
// a tight/off-centre cluster to the bullseye. Deterministic seeded points.
const DW = 152, DP = 12, DCX = DW / 2, DCY = DW / 2;
const drr = (v: number) => Math.round(v * 100) / 100;
function dartPts(mode: "bag" | "boost") {
  let seed = mode === "bag" ? 3 : 9;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 11; i++) {
    if (mode === "bag") {
      const a = rnd() * Math.PI * 2, r = 8 + rnd() * 40;   // wide spread, centred
      pts.push({ x: DCX + Math.cos(a) * r, y: DCY + Math.sin(a) * r });
    } else {
      const a = rnd() * Math.PI * 2, r = rnd() * 12;        // tight cluster, offset
      pts.push({ x: DCX - 30 + Math.cos(a) * r, y: DCY - 26 + Math.sin(a) * r });
    }
  }
  return pts;
}
const DART_BAG = dartPts("bag");
const DART_BOOST = dartPts("boost");
function DartFig({ mode }: { mode: "bag" | "boost" }) {
  const boost = mode === "boost";
  const pts = boost ? DART_BOOST : DART_BAG;
  return (
    <figure style={{ margin: 0, width: DW }}>
      <svg viewBox={`0 0 ${DW} ${DW + 8}`} width="100%" style={{ maxWidth: DW, display: "block" }} role="img" aria-label={boost ? "boosting marches a biased cluster to the target" : "bagging averages a scattered spread"}>
        <text x={DCX} y={11} textAnchor="middle" fontSize={10.5} fill="var(--ink)" style={{ fontWeight: 600 }}>{boost ? "Boosting → kills bias" : "Bagging → kills variance"}</text>
        {[46, 30, 15].map((r, i) => (
          <circle key={i} cx={DCX} cy={DCY + 6} r={r} fill={i === 2 ? `color-mix(in srgb, var(--c-trees) 14%, var(--surface))` : "none"} stroke="var(--border-strong)" strokeWidth={1} />
        ))}
        <circle cx={DCX} cy={DCY + 6} r={2} fill="var(--border-strong)" />
        {/* individual shots */}
        {pts.map((p, i) => (
          <circle key={i} cx={drr(p.x)} cy={drr(p.y + 6)} r={2.3} fill="var(--muted)" opacity={0.75} />
        ))}
        {boost ? (
          // arrow marching the cluster to the bullseye
          <g stroke="var(--c-trees)" strokeWidth={1.6} fill="var(--c-trees)">
            <line x1={DCX - 30} y1={DCY - 26 + 6} x2={DCX - 7} y2={DCY - 3 + 6} />
            <polygon points={`${DCX - 10},${DCY - 9 + 6} ${DCX - 3},${DCY - 6 + 6} ${DCX - 7},${DCY + 1 + 6}`} stroke="none" />
          </g>
        ) : (
          // the averaged shot at the centre
          <circle cx={DCX} cy={DCY + 6} r={4.5} fill="var(--c-trees)" stroke="var(--surface)" strokeWidth={1} />
        )}
      </svg>
    </figure>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const tbl: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13, margin: "4px 0 2px" };
const th: React.CSSProperties = { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border-strong)", color: "var(--ink)", fontWeight: 600 };
const td: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--muted)", verticalAlign: "top" };
const tdh: React.CSSProperties = { ...td, color: "var(--ink)", fontWeight: 500, whiteSpace: "nowrap" };
