import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Train, validation, test — Manifold",
  description:
    "Three splits with three different jobs, and the rule that makes the third one worth having: the test set answers exactly one question, exactly once, after every decision is final.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Static figure: three splits, three jobs, and how many times each may be
// consulted. Module scope, fixed coords, server component.
const FW = 380, FH = 152;
const BAR = { x: 24, y: 34, w: 332, h: 34 };
const PARTS = [
  { frac: 0.6, label: "train", job: "fit the model", uses: "every epoch", fill: "var(--ink)", op: 0.85 },
  { frac: 0.2, label: "validation", job: "choose the model", uses: "every comparison", fill: "var(--c-metrics)", op: 0.75 },
  { frac: 0.2, label: "test", job: "report the number", uses: "once, at the end", fill: "var(--brand-2)", op: 0.85 },
];

function SplitFigure() {
  let acc = 0;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Three splits, three jobs
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        the proportions are a common default, not a law
      </div>
      <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width: "100%", maxWidth: FW, height: "auto", display: "block" }}>
        {PARTS.map((p) => {
          const x = BAR.x + acc * BAR.w;
          const w = p.frac * BAR.w;
          acc += p.frac;
          return (
            <g key={p.label}>
              <rect x={x} y={BAR.y} width={w - 2} height={BAR.h} rx={5} fill={p.fill} fillOpacity={p.op} />
              <text x={x + w / 2 - 1} y={BAR.y + 21} fontSize={11} fill="var(--paper)" textAnchor="middle">{p.label}</text>
              <text x={x + w / 2 - 1} y={BAR.y + BAR.h + 16} fontSize={9.5} fill="var(--ink)" textAnchor="middle">{p.job}</text>
              <text x={x + w / 2 - 1} y={BAR.y + BAR.h + 29} fontSize={9} fill="var(--faint)" textAnchor="middle">{p.uses}</text>
            </g>
          );
        })}
        <text x={BAR.x} y={BAR.y - 10} fontSize={9.5} fill="var(--muted)">all your labelled data</text>
        <text x={FW / 2} y={FH - 6} fontSize={9.5} fill="var(--bad)" textAnchor="middle">
          look at the test set twice and it becomes a validation set
        </text>
      </svg>
    </div>
  );
}

export default function TrainValTestPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Validation", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 6 minutes"
        title={<>Train, validation, test</>}
        intro={<>Three splits that everyone can name and many people misuse. What separates them isn&rsquo;t size or
          sampling — it&rsquo;s how many decisions each one is allowed to influence.</>}
      />

      <div className="lesson">
        <h2>Why three, not two</h2>
        <p>
          The previous page established that fitting and selecting both overfit. They therefore need{" "}
          <em>separate</em> data, and the number you finally report needs data that took part in neither:
        </p>

        <SplitFigure />

        <ul>
          <li><strong>Train</strong> — solves the inner problem: given a class, find its best member. Consulted constantly.</li>
          <li><strong>Validation</strong> — solves the outer problem: given several classes, pick one. Consulted once per comparison, and every consultation costs a little optimism.</li>
          <li><strong>Test</strong> — solves neither. Its only job is to produce an unbiased estimate of the final system, which requires that it influenced <em>nothing</em>.</li>
        </ul>
        <p>
          The rule that makes the third split worth having is uncomfortably strict:{" "}
          <strong>the test set answers exactly one question, exactly once, after every decision is
          final.</strong> Look at it, change something, and look again — and it has silently become a validation
          set, with all the optimism that implies. There is no procedure for un-seeing it.
        </p>

        <Callout color={GRAY} title={<>The honest reason this is hard</>}>
          Nobody violates this rule by deciding to cheat. They see a disappointing test number, notice a plausible
          bug, fix it, and re-evaluate — which is <em>good engineering</em> and <em>invalid statistics</em> at the
          same time. The defence is procedural rather than moral: keep the test set in a separate file, write the
          evaluation as a script you run once, and decide in advance what result would change your mind. If you do
          end up touching it repeatedly, the honest move is to say so and treat the number as optimistic, not to
          pretend the first look didn&rsquo;t happen.
        </Callout>

        <h2>How big should each be?</h2>
        <p>
          Size the <em>test</em> set by the precision you need, not by a habit. From{" "}
          <Link href="/learn/math-foundations/hoeffding" style={link}>Hoeffding</Link>, the 95% error bar on an
          accuracy measured over <M>n</M> points is about <M>{String.raw`\sqrt{\ln(40)/2n}`}</M>:
        </p>
        <ul>
          <li><M>{String.raw`n = 500`}</M> → ±0.061. Enough to tell 0.70 from 0.85, useless for 0.90 vs 0.92.</li>
          <li><M>{String.raw`n = 2{,}000`}</M> → ±0.030.</li>
          <li><M>{String.raw`n = 10{,}000`}</M> → ±0.014.</li>
        </ul>
        <p>
          So if your decision hinges on a two-point difference, a 500-row test set cannot resolve it and no
          amount of careful methodology will change that. Percentages like &ldquo;80/10/10&rdquo; are a reasonable
          default for mid-sized data and actively misleading at the extremes: with ten million rows, 1% is a
          hundred thousand — far more than you need for a tight bar, and better spent on training.
        </p>
        <p>
          The <em>validation</em> set should grow with how much selecting you plan to do, since optimism scales as{" "}
          <M>{String.raw`\sqrt{\ln k / n_{\text{val}}}`}</M>. A big grid on a small validation set is the worst
          combination available.
        </p>

        <h2>When a single split isn&rsquo;t enough</h2>
        <p>
          With a few thousand examples, holding out 20% for validation hurts twice: the model trains on less data,
          and the validation estimate itself is noisy enough that your selection may just be picking validation
          noise. Cross-validation fixes both by reusing every point in both roles — next page.
        </p>

        <PrevNext
          prev={{ href: "/learn/model-selection/the-selection-trap", label: <>← The selection trap</> }}
          next={{ href: "/learn/model-selection/cross-validation", label: <>Next up · Cross-validation →</> }}
        />
      </div>
    </article>
  );
}
