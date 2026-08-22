import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Forest vs tree vs boosting — Manifold",
  description:
    "Where a random forest sits among tree methods: a single tree for interpretability, a forest as the robust default, gradient boosting for the highest ceiling. Bagging reduces variance in parallel; boosting reduces bias in sequence.",
};

const TREES = "var(--c-trees)";

const ROWS: [string, string, string, string][] = [
  ["How trees combine", "just one", "in parallel, then averaged", "in sequence, each fixes the last"],
  ["Mainly reduces", "nothing (baseline)", "variance", "bias"],
  ["Base trees are", "one deep tree", "deep, low-bias trees", "shallow, high-bias stumps"],
  ["Adding more trees", "n/a", "never overfits — plateaus", "can overfit — needs early stopping"],
  ["Trains in parallel?", "n/a", "yes — embarrassingly", "no — inherently sequential"],
  ["Tuning effort", "low", "low (great defaults)", "high (lr, depth, rounds…)"],
  ["Interpretability", "excellent", "moderate (importances)", "moderate (importances/SHAP)"],
  ["Typical accuracy", "baseline", "strong", "usually the highest"],
];

export default function ComparisonPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Forest vs tree vs boosting</>}
        intro={<>
          Three ways to use decision trees, three different bets. Knowing which to reach for — and why — is the
          practical payoff of this whole family.
        </>}
      />

      <div className="lesson">
        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13, minWidth: 620 }}>
            <thead>
              <tr>
                <th style={th}></th>
                <th style={th}>Single tree</th>
                <th style={{ ...th, color: "var(--c-trees)" }}>Random forest</th>
                <th style={th}>Gradient boosting</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, a, b, c]) => (
                <tr key={label}>
                  <td style={{ ...td, color: "var(--muted)", fontWeight: 500 }}>{label}</td>
                  <td style={td}>{a}</td>
                  <td style={{ ...td, background: "color-mix(in srgb, var(--c-trees) 5%, transparent)" }}>{b}</td>
                  <td style={td}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>The core split: parallel variance vs sequential bias</h2>
        <p>
          Everything in that table flows from one distinction. <strong>Bagging</strong> (the forest) builds
          many low-bias, high-variance trees <em>independently</em> and averages them — attacking{" "}
          <em>variance</em>. <strong>Boosting</strong> builds many high-bias, low-variance stumps{" "}
          <em>sequentially</em>, each new tree fitting the errors the previous ones left behind — attacking{" "}
          <em>bias</em>. Same base learner, opposite strategies, opposite failure modes:
        </p>
        <ul style={ul}>
          <li>A forest is <strong>hard to break</strong>: more trees never hurt, defaults are strong, it
            parallelises. Its ceiling is a touch lower.</li>
          <li>Boosting has a <strong>higher ceiling</strong> — it usually wins tabular leaderboards — but more
            rounds <em>can</em> overfit, it can&rsquo;t parallelise across trees, and it needs careful tuning of
            learning rate, depth, and stopping.</li>
        </ul>

        <Callout color={TREES} title={<>The practitioner&rsquo;s ladder</>}>
          A common workflow: fit a <strong>single shallow tree</strong> to understand the data and get a
          readable baseline; fit a <strong>random forest</strong> as the strong, no-fuss default and a
          reference score; then, if the last few points of accuracy are worth the effort, tune a{" "}
          <strong>gradient-boosted</strong> model to push past it. Each rung trades interpretability and
          robustness for ceiling.
        </Callout>

        <p>
          Boosting is its own track in this family — <Link href="/map" style={link}>next on the map</Link>. It
          reuses everything you know about trees, then flips the combination strategy from parallel to
          sequential.
        </p>

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>A random forest reduces mainly <em>variance</em>; gradient boosting reduces mainly <em>bias</em>. Why?</>,
              options: [
                "Forests use entropy, boosting uses Gini",
                "Forests average many low-bias/high-variance trees; boosting sequentially adds high-bias trees that each cut the remaining error",
                "They reduce the same thing",
              ],
              answer: 1,
              explain: <>Averaging independent deep trees divides variance while preserving low bias. Boosting stacks shallow (high-bias) trees, each fitting the residual error, which drives bias down.</>,
            },
            {
              q: <>Which statement about adding more trees is correct?</>,
              options: [
                "More trees can overfit a forest but not a boosted model",
                "More trees can overfit a boosted model but not a forest",
                "More trees overfit both equally",
              ],
              answer: 1,
              explain: <>Forest variance only plateaus as B grows — it never turns up. Boosting keeps fitting residuals, so too many rounds overfit; it needs early stopping.</>,
            },
            {
              q: <>You want a strong tabular model with minimal tuning and the ability to train across many cores. Pick:</>,
              options: [
                "Gradient boosting",
                "A random forest",
                "A single deep tree",
              ],
              answer: 1,
              explain: <>Forests have excellent defaults and are embarrassingly parallel. Boosting has a higher ceiling but needs sequential training and careful tuning; a single tree is a weaker baseline.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/random-forests/imbalanced-forests", label: <>← Imbalanced & weighted forests</> }}
          next={{ href: "/learn/random-forests/regression-forests", label: <>Next up · Regression forests →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1.5px solid var(--border-strong)", color: "var(--ink)", fontWeight: 600, fontSize: 12.5 };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--ink)", verticalAlign: "top", lineHeight: 1.5 };
const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
