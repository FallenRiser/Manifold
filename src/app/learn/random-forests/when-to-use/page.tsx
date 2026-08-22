import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "When to use a random forest — Manifold",
  description:
    "The honest verdict: the random forest is the best first model for most tabular problems — strong, robust, low-tuning — but the wrong tool for extrapolation, tiny latency budgets, and genuinely smooth or linear signals.",
};

const TREES = "var(--c-trees)";

export default function WhenToUsePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>When to use a random forest</>}
        intro={<>
          If a single tree is the model you reach for to <em>understand</em> data, the random forest is the one
          you reach for to <em>predict</em> it — so often that &ldquo;just try a random forest&rdquo; is the
          most reliable advice in tabular machine learning. Here&rsquo;s when that reflex is right, and when it
          isn&rsquo;t.
        </>}
      />

      <div className="lesson">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, margin: "1.5rem 0" }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid color-mix(in srgb, var(--good) 35%, var(--border))", background: "color-mix(in srgb, var(--good) 6%, var(--surface))" }}>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: "var(--good)", marginBottom: 8 }}>Reach for a forest when…</div>
            <ul style={ulTight}>
              <li>You have <strong>tabular data</strong> and want a strong result <strong>fast, with little tuning</strong>.</li>
              <li>You want a <strong>trustworthy baseline</strong> before investing in anything fancier.</li>
              <li>Features are <strong>mixed types</strong>, with non-linearities and interactions, and maybe missing values.</li>
              <li>You value <strong>robustness</strong>: no exploding gradients, no divergence, more trees never hurt.</li>
              <li>You want <strong>free validation</strong> (OOB) and <strong>stable feature importance</strong> out of the box.</li>
            </ul>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid color-mix(in srgb, var(--bad) 35%, var(--border))", background: "color-mix(in srgb, var(--bad) 6%, var(--surface))" }}>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: "var(--bad)", marginBottom: 8 }}>Look elsewhere when…</div>
            <ul style={ulTight}>
              <li>You must <strong>extrapolate</strong> beyond the training range — forests predict flat.</li>
              <li>You need the <strong>last few points of accuracy</strong> on a Kaggle-style board — tune <strong>gradient boosting</strong>.</li>
              <li>The signal is genuinely <strong>linear or smooth</strong> — a linear model or spline is simpler and extrapolates.</li>
              <li>You need a <strong>tiny, fast, or fully interpretable</strong> model — ship a single pruned tree or a linear model.</li>
              <li>Data is <strong>images / text / audio</strong> — that&rsquo;s neural-network territory, not trees.</li>
            </ul>
          </div>
        </div>

        <Callout color={TREES} title={<>The default worth defaulting to</>}>
          For a new tabular problem, a random forest is close to the ideal first move: it will tell you within
          minutes whether the features carry signal, give you a score good enough to beat most careful linear
          modelling, and rarely embarrass you. Start here, read its OOB score and importances, and <em>then</em>{" "}
          decide whether a boosted model, a linear model, or more feature work is worth it.
        </Callout>

        <h2>A pre-flight checklist</h2>
        <ul style={ul}>
          <li><strong>Push <code>n_estimators</code> up</strong> (say 300–500) and confirm with the OOB score;
            remember more trees can&rsquo;t overfit.</li>
          <li><strong>Lightly tune <code>max_features</code></strong> — the one knob with real leverage.</li>
          <li><strong>Rank features with permutation importance</strong>, not raw MDI, and watch for correlated
            groups sharing credit.</li>
          <li><strong>Check the baselines.</strong> If a linear model matches the forest, prefer the simpler,
            extrapolating model; if you need more, race a gradient-boosted model next.</li>
          <li><strong>Mind the size.</strong> Hundreds of deep trees are big — check your memory and latency
            budget before shipping.</li>
        </ul>

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>You're handed a new tabular dataset and want a strong, low-effort baseline fast. Best first model?</>,
              options: ["A tuned neural network", "A random forest", "A single unpruned tree"],
              answer: 1,
              explain: <>The forest's strong defaults, robustness, and free OOB estimate make it the ideal first move on tabular data — a reliable reference before investing in anything fancier.</>,
            },
            {
              q: <>For which task is a random forest structurally the wrong choice?</>,
              options: [
                "Mixed numeric/categorical features with interactions",
                "Forecasting a value that must continue a rising trend beyond the training range",
                "A quick trustworthy baseline",
              ],
              answer: 1,
              explain: <>Forests are piecewise-constant and can't extrapolate — they predict a flat value beyond the training range. Use a model that can extend a trend.</>,
            },
            {
              q: <>You've fit a good forest but need a couple more points of accuracy for a leaderboard, interpretability aside. Next move?</>,
              options: [
                "Add more trees to the forest",
                "Tune a gradient-boosted model",
                "Switch to a single tree",
              ],
              answer: 1,
              explain: <>More trees only plateau. Boosting reduces bias and typically has the higher ceiling on tabular data — at the cost of more tuning and no parallel training.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/random-forests/importance-for-correlated-features", label: <>← Importance for correlated features</> }}
          next={{ href: "/learn/random-forests/case-a-covertype", label: <>Next up · Case: the forest as a default →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const ulTight: React.CSSProperties = { margin: 0, paddingLeft: "1.2em", fontSize: 13.5, color: "var(--ink)", lineHeight: 1.7 };
