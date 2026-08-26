import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Structural risk minimization — Manifold",
  description:
    "Don't pick one hypothesis class — order a whole nested family by capacity and let a penalized objective choose the level. SRM is the principle that model selection is optimisation over classes, and it names what cross-validation does empirically.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Static figure: nested classes, the two curves, and the sum with its minimum.
const FW = 380, FH = 210, PD = { l: 40, r: 14, t: 30, b: 34 };
const x0 = PD.l, x1 = FW - PD.r, y0 = FH - PD.b, y1 = PD.t;
const px = (t: number) => x0 + t * (x1 - x0);
const py = (v: number) => y0 - (v / 1.0) * (y0 - y1);

// illustrative shapes: empirical risk falls, capacity penalty rises, sum is U
const emp = (t: number) => 0.62 * Math.exp(-3.1 * t) + 0.05;
const pen = (t: number) => 0.06 + 0.72 * t * t;
const sum = (t: number) => emp(t) + pen(t);
const mk = (f: (t: number) => number) =>
  Array.from({ length: 61 }, (_, i) => i / 60).map((t) => `${px(t).toFixed(2)},${py(f(t)).toFixed(2)}`).join(" ");

let tBest = 0, vBest = Infinity;
for (let i = 0; i <= 60; i++) { const t = i / 60; if (sum(t) < vBest) { vBest = sum(t); tBest = t; } }

function SrmFigure() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Choosing the level of the structure
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        the shape of the trade-off — schematic, not a measurement
      </div>
      <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width: "100%", maxWidth: FW, height: "auto", display: "block" }}>
        <rect x={x0} y={y1} width={x1 - x0} height={y0 - y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <polyline points={mk(emp)} fill="none" stroke="var(--ink)" strokeWidth={1.8} strokeDasharray="4 3" />
        <polyline points={mk(pen)} fill="none" stroke="var(--c-metrics)" strokeWidth={1.8} strokeDasharray="4 3" />
        <polyline points={mk(sum)} fill="none" stroke="var(--brand-2)" strokeWidth={2.4} />
        <line x1={px(tBest)} y1={y1} x2={px(tBest)} y2={y0} stroke="var(--brand-2)" strokeWidth={1} strokeDasharray="2 3" opacity={0.6} />
        <circle cx={Number(px(tBest).toFixed(2))} cy={Number(py(sum(tBest)).toFixed(2))} r={4} fill="var(--brand-2)" />

        <text x={px(0.62)} y={py(emp(0.62)) + 14} fontSize={9.5} fill="var(--muted)">empirical risk</text>
        <text x={px(0.66)} y={py(pen(0.66)) - 7} fontSize={9.5} fill="var(--c-metrics)">capacity penalty</text>
        <text x={px(tBest)} y={y1 - 8} fontSize={9.5} fill="var(--brand-2)" textAnchor="middle">the bound&rsquo;s minimum</text>

        <text x={x0} y={y0 + 14} fontSize={9.5} fill="var(--faint)">H₁ (small)</text>
        <text x={x1} y={y0 + 14} fontSize={9.5} fill="var(--faint)" textAnchor="end">H₆ (large)</text>
        <text x={(x0 + x1) / 2} y={y0 + 27} fontSize={10} fill="var(--muted)" textAnchor="middle">level of the nested family</text>
      </svg>
    </div>
  );
}

export default function SrmPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capacity", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 6 minutes"
        title={<>Structural risk minimization</>}
        intro={<>Stop choosing <em>a</em> hypothesis class. Order a whole family of them by capacity, and let a
          single penalized objective pick the level. It is the principle that turns model selection from a habit
          into an optimisation problem.</>}
      />

      <div className="lesson">
        <h2>The structure</h2>
        <p>
          Build a nested sequence of classes, each containing the last:
        </p>
        <MathBlock>{String.raw`\mathcal H_1 \subset \mathcal H_2 \subset \mathcal H_3 \subset \cdots \qquad d_1 \le d_2 \le d_3 \le \cdots`}</MathBlock>
        <p>
          Polynomials of degree <M>{String.raw`1, 2, 3, \dots`}</M> Trees of depth{" "}
          <M>{String.raw`1, 2, 3, \dots`}</M> Weight vectors with{" "}
          <M>{String.raw`\|w\| \le B_1 \le B_2 \le \dots`}</M> Neural networks with more units. You already build
          these constantly; SRM just names the object.
        </p>
        <p>
          Now, instead of minimizing empirical risk inside one class, minimize a{" "}
          <em>bound on true risk</em> across the whole family — empirical risk plus the capacity penalty that
          class&rsquo;s size implies:
        </p>
        <MathBlock>{String.raw`\hat h_{\text{SRM}} \;=\; \arg\min_{k}\; \Big[\; \min_{h \in \mathcal H_k} \hat R_S(h) \;+\; \underbrace{\text{penalty}(d_k, n)}_{\text{from the bound}} \Big]`}</MathBlock>

        <SrmFigure />

        <p>
          The first term falls as you climb the structure — bigger classes fit better, always. The second rises,
          because bigger classes are less trustworthy. Their sum has a minimum, and{" "}
          <strong>that minimum is the model you should pick</strong>. Vapnik proposed this in the 1970s, and it is
          the direct ancestor of every &ldquo;fit plus complexity penalty&rdquo; criterion you&rsquo;ve met.
        </p>

        <Callout color={GRAY} title={<>SRM versus cross-validation: the same job, different instrument</>}>
          Both choose the level of a structure. SRM uses a <strong>theoretical</strong> penalty derived from a
          bound; cross-validation <strong>measures</strong> the penalty empirically by holding data out. In
          practice CV wins nearly every time, for the reason the{" "}
          <Link href="/learn/learning-theory/the-vc-bound" style={link}>VC bound page</Link> measured directly —
          theoretical penalties are far too loose to be quantitatively useful, so SRM with a real VC penalty would
          systematically pick a class much too small. What survives is the <em>shape</em>: fit plus penalty, minimised
          over a nested family. Cross-validation is SRM with an empirically estimated penalty, and that is the
          cleanest way to hold the relationship in your head.
        </Callout>

        <h2>Why nesting matters</h2>
        <p>
          The classes must be <em>nested</em> for the argument to work, and it&rsquo;s worth seeing why. Nesting
          guarantees the empirical-risk term is monotone decreasing, so the trade-off has the clean shape above and
          the level index means something. Compare a totally unordered collection of candidates — a random forest,
          a linear model, a k-NN — and there is no structure, no monotone curve, and no principled penalty.
          You&rsquo;re back to plain selection over <M>k</M> candidates, paying the{" "}
          <Link href="/learn/model-selection/the-selection-trap" style={link}>selection trap</Link>&rsquo;s{" "}
          <M>{String.raw`\sqrt{\ln k}`}</M>.
        </p>
        <p>
          This is a real practical distinction. Tuning <M>{String.raw`\lambda`}</M> along a regularization path is
          searching a structure — cheap, well-behaved, and the reason warm-started paths work. Comparing six
          unrelated model families is not, and deserves more caution per comparison.
        </p>

        <p>
          The next three pages are the three penalties people actually use: a norm penalty, a step budget, and an
          information criterion. They look unrelated and they are all the same move.
        </p>

        <PrevNext
          prev={{ href: "/learn/model-selection/nested-cross-validation", label: <>← Nested cross-validation</> }}
          next={{ href: "/learn/model-selection/regularization-as-capacity", label: <>Next up · Regularization as capacity control →</> }}
        />
      </div>
    </article>
  );
}
