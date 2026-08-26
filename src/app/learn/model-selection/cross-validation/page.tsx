import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CrossValidationLab } from "@/components/labs/CrossValidationLab";

export const metadata = {
  title: "Cross-validation — Manifold",
  description:
    "Every point takes a turn being held out, so every point trains and every point validates. It buys a lower-variance estimate and more training data at the cost of k fits — and it does nothing at all about selection bias.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Static figure: the k-fold rotation. Fixed coords, module scope.
const K = 5, FW = 380, ROW_H = 22, LEFT = 62, TOP = 30;
const CELL_W = (FW - LEFT - 16) / K;
const FH = TOP + K * ROW_H + 26;

function FoldFigure() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        5-fold cross-validation
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        each fold is held out exactly once
      </div>
      <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width: "100%", maxWidth: FW, height: "auto", display: "block" }}>
        {Array.from({ length: K }).map((_, r) => (
          <g key={r}>
            <text x={LEFT - 10} y={TOP + r * ROW_H + 14} fontSize={10} fill="var(--muted)" textAnchor="end">round {r + 1}</text>
            {Array.from({ length: K }).map((__, c) => (
              <rect
                key={c}
                x={LEFT + c * CELL_W} y={TOP + r * ROW_H + 3}
                width={CELL_W - 3} height={ROW_H - 6} rx={3}
                fill={c === r ? "var(--brand-2)" : "var(--ink)"}
                fillOpacity={c === r ? 0.85 : 0.16}
              />
            ))}
          </g>
        ))}
        <text x={LEFT} y={TOP - 8} fontSize={9.5} fill="var(--muted)">the data, split into 5 folds</text>
        <text x={LEFT} y={FH - 8} fontSize={9.5} fill="var(--brand-2)">■ held out for scoring</text>
        <text x={LEFT + 122} y={FH - 8} fontSize={9.5} fill="var(--muted)">■ used for fitting</text>
      </svg>
    </div>
  );
}

export default function CrossValidationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Validation", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 7 minutes"
        title={<>Cross-validation</>}
        intro={<>Let every point take a turn being held out. You get a lower-variance estimate and you stop
          sacrificing a fifth of your data — for the price of fitting <M>k</M> times. It is the default for a
          reason, and it fixes less than most people assume.</>}
      />

      <div className="lesson">
        <h2>The procedure</h2>
        <p>
          Split the data into <M>k</M> equal folds. For each round, hold one fold out, fit on the other{" "}
          <M>{String.raw`k-1`}</M>, and score on the held-out fold. Average the <M>k</M> scores.
        </p>

        <FoldFigure />

        <MathBlock>{String.raw`\text{CV}_k \;=\; \frac{1}{k}\sum_{j=1}^{k} \hat R_{\text{fold } j}\big(\hat h^{(-j)}\big)`}</MathBlock>
        <p>
          Every point is scored exactly once, by a model that never saw it. Every point also contributes to
          training in <M>{String.raw`k-1`}</M> of the rounds. That double duty is the whole trick, and it buys two
          things at once: each fit uses <M>{String.raw`(k-1)/k`}</M> of your data rather than 80%, and averaging{" "}
          <M>k</M> estimates cuts the variance of the estimate itself.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>You use 5-fold CV to pick the best of 200 hyperparameter configurations, then report the winner's CV score as your model's performance. Is that number unbiased?</>}
          options={[
            "Yes — cross-validation is designed to give unbiased estimates",
            "No — CV fixes the variance of each estimate, but the winner is still a maximum over 200 noisy numbers",
            "Yes, provided the folds were stratified",
          ]}
        />

        <LabFrame
          accent={GRAY}
          tryThis={<>Drag the degree and watch the validation curve. Find the minimum, then look at how flat the curve is on either side of it.</>}
          insight={<>The validation curve has a minimum, and it is usually <em>flatter</em> around that minimum than people expect. When several degrees score within noise of each other, picking the exact argmin is picking noise — which is precisely the argument for the <Link href="/learn/model-selection/one-standard-error-rule" style={link}>one-standard-error rule</Link> later in this chapter.</>}
        >
          <CrossValidationLab />
        </LabFrame>

        <h2>What cross-validation actually estimates</h2>
        <p>
          A subtlety worth being precise about, because it explains a puzzle people hit. <M>{String.raw`\text{CV}_k`}</M>{" "}
          does not estimate the performance of any single model you have. Each fold produces a{" "}
          <em>different</em> fitted model, and you average their scores. What you are estimating is the expected
          performance of <strong>your whole training procedure</strong> when given{" "}
          <M>{String.raw`n(k-1)/k`}</M> examples.
        </p>
        <p>
          That is usually what you want — you are choosing a procedure, not a particular fitted object — but it has
          a consequence: because each fold trains on less data than your final model will, CV is slightly{" "}
          <strong>pessimistic</strong> about the model you eventually ship on all <M>n</M> points. With{" "}
          <M>{String.raw`k = 5`}</M> each fit sees 80% of the data; with <M>{String.raw`k = 10`}</M>, 90%. This
          pessimism partially offsets the selection optimism from the previous page, which is a genuine effect and
          absolutely not something to rely on: the two have no reason to cancel, and which dominates depends on
          how big your grid was.
        </p>

        <Callout color={GRAY} title={<>What CV does not fix</>}>
          Cross-validation reduces the <em>variance</em> of each score. It does nothing whatsoever about{" "}
          <strong>selection bias</strong>. If you compare 200 configurations by CV and report the winner&rsquo;s CV
          score, you have made the same mistake as before with better error bars — you are still reporting a
          maximum over 200 noisy numbers. We measure this on a real problem two pages from now and find{" "}
          <M>{String.raw`+0.0060`}</M> of optimism from exactly this. The fix is nesting, not more folds.
        </Callout>

        <h2>Stratify, and mind the leakage</h2>
        <p>
          Two implementation details that cause more real damage than the choice of <M>k</M>:
        </p>
        <ul>
          <li>
            <strong>Stratify for classification.</strong> With imbalanced classes, random folds can vary the
            positive rate substantially, adding variance for no reason — and with a rare class, a fold may contain
            none at all. Stratified folds preserve the class ratio in every fold.
          </li>
          <li>
            <strong>Every fitting step goes inside the fold.</strong> Scaling, imputation, feature selection,
            resampling, target encoding — if it learns anything from data, it must be fit on the training portion
            of each fold only. Scaling before splitting leaks the held-out fold&rsquo;s mean and standard
            deviation into training. A <code>Pipeline</code> exists precisely so this is the default rather than
            a thing you must remember; the{" "}
            <Link href="/learn/polynomial-regression/pipelines-scaling-and-leakage" style={link}>polynomial
            track</Link> works a concrete example through.
          </li>
        </ul>

        <PrevNext
          prev={{ href: "/learn/model-selection/train-validation-test", label: <>← Train, validation, test</> }}
          next={{ href: "/learn/model-selection/how-many-folds", label: <>Next up · How many folds? →</> }}
        />
      </div>
    </article>
  );
}
