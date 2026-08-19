import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "When to use a single tree — Manifold",
  description:
    "The honest verdict on lone decision trees: unbeatable for interpretability and EDA, rarely the accuracy winner. When to reach for one, when to avoid it, and why the answer is usually an ensemble of them.",
};

const TREES = "var(--c-trees)";

export default function WhenToUsePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>When to use a single tree</>}
        intro={<>
          Time for the honest verdict. A lone decision tree is one of the most useful models to <em>understand</em>
          and one of the least likely to be the model you <em>ship</em> for accuracy. Knowing which situation
          you&rsquo;re in is the whole skill.
        </>}
      />

      <div className="lesson">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, margin: "1.5rem 0" }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid color-mix(in srgb, var(--good) 35%, var(--border))", background: "color-mix(in srgb, var(--good) 6%, var(--surface))" }}>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: "var(--good)", marginBottom: 8 }}>Reach for a single tree when…</div>
            <ul style={ulTight}>
              <li>You need a model a human can <strong>read and defend</strong> — a flowchart for a stakeholder, a regulator, a clinician.</li>
              <li>You&rsquo;re doing <strong>EDA</strong>: a shallow tree quickly reveals the dominant features and interactions.</li>
              <li>Features are a <strong>mix of types</strong> with missing values and you want zero preprocessing.</li>
              <li>Inference must be <strong>trivially cheap</strong> and traceable — a few comparisons, no matrix math.</li>
            </ul>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid color-mix(in srgb, var(--bad) 35%, var(--border))", background: "color-mix(in srgb, var(--bad) 6%, var(--surface))" }}>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: "var(--bad)", marginBottom: 8 }}>Avoid a single tree when…</div>
            <ul style={ulTight}>
              <li><strong>Accuracy is the goal.</strong> An ensemble of trees almost always beats one, often by a lot.</li>
              <li>The true relationship is <strong>smooth or linear</strong> — the staircase wastes data approximating a line.</li>
              <li>You need to <strong>extrapolate</strong> beyond the training range — trees predict flat forever.</li>
              <li>The signal is <strong>subtle and additive</strong> across many weak features — a single tree is too coarse.</li>
            </ul>
          </div>
        </div>

        <h2>The elephant in the room: use the ensemble</h2>
        <p>
          Everything that makes a single tree weak on accuracy — its high variance, its blocky fit, its
          instability — is fixed by combining many trees. On tabular data, a{" "}
          <Link href="/map" style={link}>random forest</Link> or a{" "}
          <Link href="/map" style={link}>gradient-boosted ensemble</Link> is very often the strongest model
          available, full stop, and it inherits the tree&rsquo;s no-preprocessing convenience. The practical
          rule most practitioners follow:
        </p>
        <Callout color={TREES} title={<>The working rule</>}>
          Use a <strong>single tree to understand</strong> your data and to explain a decision; use an
          <strong> ensemble of trees to predict</strong> when accuracy is what matters. The two roles rarely
          compete — you often fit a shallow tree for the story and a boosted forest for the leaderboard, on the
          same dataset.
        </Callout>

        <h2>A pre-flight checklist</h2>
        <ul style={ul}>
          <li><strong>Set a depth or pruning budget.</strong> An unconstrained tree overfits by default — never
            ship <code>max_depth=None</code> without cross-validating it or pruning.</li>
          <li><strong>Rank features with permutation importance</strong>, not raw MDI, especially with
            mixed-cardinality features (<Link href="/learn/decision-trees/feature-importance" style={link}>previous
            page</Link>).</li>
          <li><strong>Check the baseline.</strong> If a linear model matches your tree, the relationship is
            probably smooth — prefer the simpler, extrapolating model.</li>
          <li><strong>Before optimising a lone tree, try a forest.</strong> If the ensemble is much better
            (it usually is) and you don&rsquo;t need the interpretability, the decision is made.</li>
        </ul>

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>You need the single best <em>accuracy</em> on a tabular dataset and interpretability is not required. What should you probably reach for?</>,
              options: [
                "A single deep decision tree",
                "An ensemble of trees (random forest or gradient boosting)",
                "A single pruned tree",
              ],
              answer: 1,
              explain: <>Ensembles fix the single tree's high variance and almost always win on accuracy for tabular data, while keeping the no-preprocessing convenience. A lone tree is for interpretability, not the leaderboard.</>,
            },
            {
              q: <>For which problem is a single tree structurally a poor fit?</>,
              options: [
                "A mix of numeric and categorical features with missing values",
                "Predicting a value that must extrapolate above the training range",
                "A dataset needing a human-readable decision rule",
              ],
              answer: 1,
              explain: <>A tree predicts the constant value of its outermost leaf beyond the training range — it can't extrapolate a trend. The other two play directly to a tree's strengths.</>,
            },
            {
              q: <>What's the single most important guardrail before trusting a lone tree?</>,
              options: [
                "Standardise the features first",
                "Constrain its size (depth or pruning) via cross-validation — an unconstrained tree overfits by default",
                "One-hot encode every feature",
              ],
              answer: 1,
              explain: <>Trees overfit unless their size is controlled. Scaling and one-hot encoding are irrelevant-to-harmful for trees; the real guardrail is a validated depth or pruning budget.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/decision-trees/feature-importance", label: <>← Feature importance & reading a tree</> }}
          next={{ href: "/learn/decision-trees/case-a-titanic", label: <>Next up · Case: predicting who survived →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const ulTight: React.CSSProperties = { margin: 0, paddingLeft: "1.2em", fontSize: 13.5, color: "var(--ink)", lineHeight: 1.7 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
