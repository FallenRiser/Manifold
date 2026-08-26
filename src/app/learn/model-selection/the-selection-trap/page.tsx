import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The selection trap — Manifold",
  description:
    "The winner's validation score is not an estimate of the winner's performance. Measured: 200 models that are all literally coin flips produce a best-of score of 0.5975 against a true 0.500 — ten points of pure illusion manufactured by choosing.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// REAL measured values from scripts/model_selection_cases.py section 1
// (2,000 trials, n_val = 200, every "model" a true-0.500 coin flip, RS=0).
const OPT: [number, number][] = [
  [1, 0.4999], [2, 0.5198], [5, 0.5410], [10, 0.5552], [50, 0.5788], [200, 0.5975],
];

const FW = 380, FH = 194, PD = { l: 46, r: 14, t: 16, b: 34 };
const x0 = PD.l, x1 = FW - PD.r, y0 = FH - PD.b, y1 = PD.t;
const px = (k: number) => x0 + (Math.log10(k) / Math.log10(200)) * (x1 - x0);
const py = (a: number) => y0 - ((a - 0.49) / 0.12) * (y0 - y1);
const PTS = OPT.map(([k, a]) => `${px(k).toFixed(2)},${py(a).toFixed(2)}`).join(" ");

function OptimismFigure() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        The winner&rsquo;s score, when nobody deserves to win
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        measured over 2,000 trials · every candidate has true accuracy exactly 0.500
      </div>
      <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width: "100%", maxWidth: FW, height: "auto", display: "block" }}>
        <rect x={x0} y={y1} width={x1 - x0} height={y0 - y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={x0} y1={py(0.5)} x2={x1} y2={py(0.5)} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={x1 - 4} y={py(0.5) - 6} fontSize={9.5} fill="var(--muted)" textAnchor="end">the truth: 0.500</text>

        <polyline points={PTS} fill="none" stroke="var(--bad)" strokeWidth={2} />
        {OPT.map(([k, a]) => (
          <g key={k}>
            <circle cx={Number(px(k).toFixed(2))} cy={Number(py(a).toFixed(2))} r={3.5} fill="var(--bad)" />
          </g>
        ))}
        <text x={px(200)} y={py(0.5975) - 8} fontSize={9.5} fill="var(--bad)" textAnchor="end">0.5975</text>

        {[0.50, 0.55, 0.60].map((v) => (
          <text key={v} x={x0 - 6} y={py(v) + 3.5} fontSize={9.5} fill="var(--faint)" textAnchor="end">{v.toFixed(2)}</text>
        ))}
        <text x={x0 - 36} y={y1 + 44} fontSize={9.5} fill="var(--muted)" transform={`rotate(-90 ${x0 - 36} ${y1 + 44})`}>best val score</text>
        {[1, 10, 200].map((v) => (
          <text key={v} x={px(v)} y={y0 + 14} fontSize={9.5} fill="var(--faint)" textAnchor="middle">{v}</text>
        ))}
        <text x={(x0 + x1) / 2} y={y0 + 27} fontSize={10} fill="var(--muted)" textAnchor="middle">models compared</text>
      </svg>
    </div>
  );
}

export default function SelectionTrapPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The selection problem", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 7 minutes"
        title={<>The selection trap</>}
        intro={<>One sentence to carry out of this whole pillar: <strong>the winner&rsquo;s validation score is not
          an estimate of the winner&rsquo;s performance.</strong> Here is what that costs, measured.</>}
      />

      <div className="lesson">
        <h2>The experiment</h2>
        <p>
          Build <M>k</M> &ldquo;models&rdquo; that are all exactly worthless — each one a coin flip with true
          accuracy 0.500. Score every one on the same validation set of 200 examples. Report the best. Repeat 2,000
          times and average.
        </p>

        <OptimismFigure />

        <p>
          With one candidate the reported score is <strong>0.4999</strong> — an unbiased estimate, exactly as
          theory promises. With two it&rsquo;s 0.5198. With ten, 0.5552. With two hundred,{" "}
          <strong>0.5975</strong>, almost ten points above the truth.
        </p>
        <p>
          Nothing was fitted. No model saw the validation data during training. Every candidate is, and remains,
          a coin flip. The entire rise is manufactured by the act of <em>choosing the maximum</em>, because the
          maximum of many noisy estimates is a biased estimator of anything — it systematically selects whichever
          candidate got the luckiest draw.
        </p>

        <Callout color={GRAY} title={<>Why the curve bends</>}>
          Notice it rises steeply at first and then flattens — the jump from 1 to 10 costs more than the jump from
          50 to 200. That&rsquo;s the same logarithm the{" "}
          <Link href="/learn/learning-theory/the-union-bound-argument" style={link}>union bound</Link> predicts:
          optimism grows roughly as <M>{String.raw`\sqrt{\ln k / n_{\text{val}}}`}</M>. Two practical readings
          follow. Comparing a handful of models is <em>cheap</em> — this is why ordinary model comparison is
          defensible. And the damage is controlled by <M>{String.raw`n_{\text{val}}`}</M>, so a bigger validation
          set is the direct antidote to a bigger search.
        </Callout>

        <h2>Where this actually bites you</h2>
        <ul>
          <li>
            <strong>Grid search, then reporting the best CV score as your performance.</strong> The most common
            instance by far, and the subject of the{" "}
            <Link href="/learn/model-selection/nested-cross-validation" style={link}>nested CV page</Link>, where we
            measure it at <M>{String.raw`+0.0060`}</M> on a real 20-point grid.
          </li>
          <li>
            <strong>Threshold tuning on the test set.</strong> Sweeping 100 thresholds and reporting the best F1 is
            a 100-model selection.
          </li>
          <li>
            <strong>&ldquo;We tried a few things.&rdquo;</strong> Every abandoned experiment counts. The search you
            did with your hands over three weeks is still a search, and it is usually larger than any grid.
          </li>
          <li>
            <strong>Feature selection using the whole dataset before splitting.</strong> A particularly severe
            case: picking the 20 best-correlated features out of 5,000 is a selection over 5,000 candidates, done
            with the test set&rsquo;s help.
          </li>
          <li>
            <strong>Public leaderboards.</strong> Thousands of teams selecting against the same held-out set is a
            union bound with an enormous <M>k</M> — which is exactly why competitions keep a second, private set.
          </li>
        </ul>

        <h2>The three defences</h2>
        <p>
          There are only three, and the rest of this pillar is their details.
        </p>
        <MathBlock>{String.raw`\textbf{(1) hold out data you never select on} \quad \textbf{(2) nest the selection} \quad \textbf{(3) select less}`}</MathBlock>
        <p>
          <strong>Hold out</strong> a test set touched exactly once, after all decisions are final — the subject of
          the next page. <strong>Nest</strong> the selection inside an outer loop so the estimate is computed on
          data the selection never saw. <strong>Select less</strong>: a smaller grid, informed by domain knowledge,
          genuinely costs less optimism, and the{" "}
          <Link href="/learn/model-selection/one-standard-error-rule" style={link}>one-standard-error rule</Link>{" "}
          deliberately declines to chase the last decimal of validation score for exactly this reason.
        </p>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · The selection problem"
          questions={[
            {
              q: <>You grid-search 200 configurations, and the best one scores 0.91 on your validation set. What is 0.91 an estimate of?</>,
              options: [
                "The chosen model's true accuracy",
                "Nothing directly — it's the maximum of 200 noisy scores, which is biased upward",
                "A lower bound on the chosen model's true accuracy",
              ],
              answer: 1,
              explain: <>The maximum of many noisy estimates is biased upward, and if anything it is an optimistic <em>upper</em> bound rather than a lower one. The measured demonstration on this page is stark: 200 candidates with true accuracy 0.500 produce a reported 0.5975. To get an estimate of the chosen model&rsquo;s performance you need data that took no part in choosing it.</>,
            },
            {
              q: <>Your team increases the grid from 20 to 2,000 configurations. Roughly what happens to the selection optimism?</>,
              options: [
                "It grows about 100-fold, in proportion to the grid",
                "It grows by roughly the square root of the ratio of logs — a factor under 2",
                "It stays the same; optimism depends only on validation set size",
              ],
              answer: 1,
              explain: <>Optimism scales like <M>{String.raw`\sqrt{\ln k}`}</M>, so a 100× bigger grid multiplies it by about <M>{String.raw`\sqrt{\ln 2000/\ln 20} = \sqrt{7.6/3.0} \approx 1.6`}</M>. That&rsquo;s the good news that makes grid search practical. Validation size matters too — it&rsquo;s the <M>n</M> under that square root — but it isn&rsquo;t the only factor.</>,
            },
            {
              q: <>Which of these is <em>not</em> an instance of the selection trap?</>,
              options: [
                "Choosing the classification threshold that maximises F1 on the test set",
                "Selecting the 20 highest-correlation features using the full dataset, then splitting",
                "Fitting a single pre-specified model once and reporting its held-out score",
              ],
              answer: 2,
              explain: <>The third is the one clean case: one hypothesis, fixed in advance, evaluated on data that chose nothing. That&rsquo;s the setting where a held-out score is genuinely unbiased. Threshold sweeping is selection over thresholds; pre-split feature selection is selection over thousands of candidates using data that later becomes your test set — the most damaging entry on the list, because the leak is invisible in the final script.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/model-selection/approximation-vs-estimation", label: <>← Approximation vs estimation</> }}
          next={{ href: "/learn/model-selection/train-validation-test", label: <>Next up · Train, validation, test →</> }}
        />
      </div>
    </article>
  );
}
