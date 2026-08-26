import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Nested cross-validation — Manifold",
  description:
    "Put the whole tuning procedure inside the loop, so the score is computed on data the tuning never saw. Measured on a real 20-point SVC grid: flat CV reports 0.9807, nested CV says 0.9747 — 0.6 points of pure selection optimism.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Static figure: the two loops. Outer folds each contain a full inner CV.
const FW = 380, OUT_H = 30, LEFT = 54, TOP = 32, K_OUT = 4, K_IN = 3;
const CW = (FW - LEFT - 16) / K_OUT;
const FH = TOP + K_OUT * OUT_H + 30;

function NestedFigure() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        A loop inside a loop
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        the outer fold is scored by a model tuned without ever seeing it
      </div>
      <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width: "100%", maxWidth: FW, height: "auto", display: "block" }}>
        {Array.from({ length: K_OUT }).map((_, r) => (
          <g key={r}>
            <text x={LEFT - 8} y={TOP + r * OUT_H + 18} fontSize={9.5} fill="var(--muted)" textAnchor="end">outer {r + 1}</text>
            {Array.from({ length: K_OUT }).map((__, c) => {
              const x = LEFT + c * CW;
              if (c === r) {
                return <rect key={c} x={x} y={TOP + r * OUT_H + 4} width={CW - 3} height={OUT_H - 9} rx={3} fill="var(--brand-2)" fillOpacity={0.85} />;
              }
              // inner folds drawn as thin stripes inside the training portion
              return (
                <g key={c}>
                  {Array.from({ length: K_IN }).map((___, s) => (
                    <rect
                      key={s}
                      x={x + s * ((CW - 3) / K_IN)} y={TOP + r * OUT_H + 4}
                      width={(CW - 3) / K_IN - 1.5} height={OUT_H - 9} rx={2}
                      fill="var(--c-metrics)" fillOpacity={s === (r + c) % K_IN ? 0.5 : 0.14}
                    />
                  ))}
                </g>
              );
            })}
          </g>
        ))}
        <text x={LEFT} y={TOP - 9} fontSize={9.5} fill="var(--muted)">outer folds, each subdivided for tuning</text>
        <text x={LEFT} y={FH - 10} fontSize={9.5} fill="var(--brand-2)">■ outer test — scores the whole procedure</text>
        <text x={LEFT} y={FH - 0} fontSize={9.5} fill="var(--muted)">■ inner folds — choose the hyperparameters</text>
      </svg>
    </div>
  );
}

const CODE = `from sklearn.model_selection import GridSearchCV, cross_val_score, StratifiedKFold

inner = StratifiedKFold(n_splits=4, shuffle=True, random_state=0)
outer = StratifiedKFold(n_splits=4, shuffle=True, random_state=100)

# the ENTIRE tuning procedure is the thing being scored
search = GridSearchCV(pipe, grid, cv=inner)

# flat: the winner grading its own homework
search.fit(X, y)
flat = search.best_score_

# nested: each outer fold is scored by a model tuned without it
nested = cross_val_score(search, X, y, cv=outer).mean()`;

export default function NestedCvPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Validation", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 8 minutes"
        title={<>Nested cross-validation</>}
        intro={<>The clean answer to the selection trap: score the <em>procedure</em>, not the winner. Then we
          measure how much it actually recovers on a real problem — and the honest number is smaller than the
          warnings usually imply.</>}
      />

      <div className="lesson">
        <h2>The idea</h2>
        <p>
          The problem with flat cross-validation is that the same folds pick the hyperparameters{" "}
          <em>and</em> produce the reported score. The winner is grading its own homework.
        </p>
        <p>
          Nested CV fixes it by treating the whole tuning procedure — grid search included — as the thing being
          evaluated. An outer loop holds out a fold; inside the remaining data, a complete inner cross-validation
          picks the hyperparameters; the resulting model is scored on the outer fold it has never seen. Repeat for
          every outer fold.
        </p>

        <NestedFigure />

        <MathBlock>{String.raw`\text{nested CV} \;=\; \frac{1}{K}\sum_{j=1}^{K} \hat R_{\text{fold } j}\Big(\underbrace{\text{tune-and-fit}\big(\text{data} \setminus \text{fold } j\big)}_{\text{a full inner CV, run } K \text{ times}}\Big)`}</MathBlock>
        <p>
          Note carefully what nested CV gives you: an unbiased estimate of <strong>how well your tuning procedure
          performs</strong>, not of any specific hyperparameter setting. Each outer fold may well select different
          hyperparameters, and that variation is a real property of your procedure that the estimate correctly
          includes. When you ship, you run the tuning once on all the data and deploy that — the nested number is
          your honest expectation for it.
        </p>

        <CodeBlock fromScratch={CODE} />

        <h2>What it costs, measured</h2>
        <p>
          Warnings about flat CV are common; actual numbers are rarer. So we ran it — breast cancer dataset, an
          SVC pipeline, a 20-point grid over <M>C</M> and <M>{String.raw`\gamma`}</M>, 4-fold inner and 4-fold
          outer, averaged over 5 repeats (<code>scripts/model_selection_cases.py</code>):
        </p>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 15px", margin: "1.2rem 0" }}>
          <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.85 }}>
            <div>flat CV — the winner&rsquo;s own grid score: <strong>0.9807</strong></div>
            <div>nested CV — the honest estimate: <strong>0.9747</strong></div>
            <div style={{ color: "var(--bad)" }}>selection optimism: <strong>+0.0060</strong></div>
          </div>
        </div>
        <p>
          Six-tenths of a point. That is real, reproducible, and <em>modest</em> — and we would rather tell you
          that than inflate it. On a 20-point grid with 569 examples, flat CV is not a catastrophe.
        </p>

        <Callout color={GRAY} title={<>When the modest number stops being modest</>}>
          Optimism grows as <M>{String.raw`\sqrt{\ln k / n}`}</M>, so the two things that turn +0.006 into
          something that matters are a <strong>much bigger search</strong> and <strong>much less data</strong>. A
          20-point grid on 569 examples is benign; a 50,000-point random search on 300 examples is not, and neither
          is a genomics study picking 20 features from 20,000. It also matters far more when the <em>decision</em>{" "}
          is close: if you are choosing between two models 0.4 points apart, an optimism of 0.6 points can invert
          your conclusion even though it looks small.
        </Callout>

        <h2>When to bother</h2>
        <ul>
          <li>
            <strong>Use nested CV</strong> when you must report a trustworthy performance number and you have no
            separate test set — small-data settings, scientific papers, anything where the number itself is a
            deliverable.
          </li>
          <li>
            <strong>Skip it</strong> when you have a genuine held-out test set that took no part in tuning. That
            test set already gives you an unbiased estimate, at <M>{String.raw`K`}</M> times less compute. Nested
            CV is what you use <em>instead of</em> a test set, not in addition to one.
          </li>
          <li>
            <strong>Cost.</strong> <M>{String.raw`K_{\text{outer}} \times K_{\text{inner}} \times |\text{grid}|`}</M>{" "}
            fits — the 4×4×20 run above is 320 fits per repeat. This is why people skip it, and why the honest
            +0.006 measurement is worth knowing: it tells you when the compute is justified.
          </li>
        </ul>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · Validation"
          questions={[
            {
              q: <>What does a nested cross-validation score actually estimate?</>,
              options: [
                "The performance of the single best hyperparameter setting found",
                "The performance of the entire tune-and-fit procedure when applied to data of this size",
                "The average performance across all hyperparameter settings in the grid",
              ],
              answer: 1,
              explain: <>Each outer fold may select different hyperparameters, so there is no single setting being estimated — and that variability is a genuine property of your procedure that the estimate rightly includes. This is why nested CV doesn&rsquo;t hand you a model to deploy: you run the tuning once on all the data for that, and the nested number is your honest expectation for the result.</>,
            },
            {
              q: <>You already have a test set that took no part in tuning. Should you also run nested CV to report performance?</>,
              options: [
                "Yes — nested CV is always more reliable than a single test set",
                "No — the untouched test set is already unbiased, at a fraction of the compute",
                "Yes, and you should average the two numbers",
              ],
              answer: 1,
              explain: <>Nested CV is the substitute for a clean test set, not a supplement. An untouched test set is already an unbiased estimate; nested CV costs <M>{String.raw`K_{\text{outer}} \times K_{\text{inner}} \times |\text{grid}|`}</M> fits to reach the same place. Averaging two estimates of different quantities isn&rsquo;t meaningful. Nested CV earns its cost when data is too scarce to spare a test split.</>,
            },
            {
              q: <>Increasing from 5-fold to 10-fold CV will reduce which problem?</>,
              options: [
                "The selection bias from comparing 200 configurations",
                "The variance and slight pessimism of each individual score estimate",
                "Leakage from scaling before the split",
              ],
              answer: 1,
              explain: <>More folds means each fit sees more data (less pessimism) and you average more estimates (somewhat less variance, limited by fold correlation). It does nothing about selection bias — that needs nesting — and nothing about leakage, which needs the preprocessing moved inside the fold via a Pipeline. Choosing <M>k</M> is the least consequential of the three decisions.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/model-selection/how-many-folds", label: <>← How many folds?</> }}
          next={{ href: "/learn/model-selection/structural-risk-minimization", label: <>Next up · Structural risk minimization →</> }}
        />
      </div>
    </article>
  );
}
