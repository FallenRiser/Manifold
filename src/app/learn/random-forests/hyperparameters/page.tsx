import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";

export const metadata = {
  title: "The random forest hyperparameters — Manifold",
  description:
    "What each forest knob does and which ones are worth tuning: n_estimators (more is never worse), max_features (the one that matters), and the tree-size limits you usually leave alone.",
};

const TREES = "var(--c-trees)";

const KNOBS: [string, string, string][] = [
  ["n_estimators", "Number of trees B.", "More never hurts accuracy — only time/memory. Set high (200–1000), stop when the OOB curve flattens. Not a bias–variance knob."],
  ["max_features", "Features considered per split (m).", "THE tuning knob. √p (classification) / p⁄3 (regression) are strong defaults. Lower = more decorrelated but weaker trees."],
  ["max_depth", "Maximum tree depth.", "Usually None — the forest controls variance by averaging, not by shallow trees. Cap it only for very noisy data or speed."],
  ["min_samples_leaf", "Minimum samples per leaf.", "Left at 1 for classification, sometimes raised for regression to smooth predictions. A mild variance knob."],
  ["max_samples", "Bootstrap sample size.", "Draw fewer than n rows per tree to speed up and add diversity on big data. Below 1.0 trades a little accuracy for a lot of speed."],
  ["class_weight", "Per-class weighting.", "Use 'balanced' for imbalanced targets so rare classes aren't drowned out in the vote."],
];

export default function HyperparametersPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>The hyperparameters</>}
        intro={<>
          Random forests have a reputation for working well out of the box, and it&rsquo;s deserved — the
          defaults are genuinely good. But a few knobs repay attention, and knowing which ones <em>don&rsquo;t</em>{" "}
          matter is as useful as knowing which do.
        </>}
      />

      <div className="lesson">
        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5, minWidth: 540 }}>
            <thead>
              <tr>
                <th style={th}>Knob</th>
                <th style={th}>What it controls</th>
                <th style={th}>In practice</th>
              </tr>
            </thead>
            <tbody>
              {KNOBS.map(([n, w, p]) => (
                <tr key={n}>
                  <td style={{ ...td, fontFamily: "var(--font-geist-mono)", color: "var(--c-trees)", whiteSpace: "nowrap" }}>{n}</td>
                  <td style={td}>{w}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>More trees are (almost) always fine</h2>
        <p>
          The most common beginner worry — &ldquo;won&rsquo;t more trees overfit?&rdquo; — is misplaced. Adding
          trees to a forest <strong>cannot increase overfitting</strong>; it only makes the averaged prediction
          more stable, driving the variance toward its floor. The test error as a function of{" "}
          <M>{String.raw`B`}</M> decreases and then flattens — it never turns back up. So{" "}
          <code>n_estimators</code> is a compute budget, not a regularisation knob. This is the opposite of
          boosting, where adding rounds <em>can</em> overfit.
        </p>

        <h2>What to actually tune</h2>
        <ol style={ol}>
          <li><strong>Set <code>n_estimators</code> high</strong> and forget it (say 500), using the OOB score to
            confirm it&rsquo;s enough.</li>
          <li><strong>Tune <code>max_features</code></strong> — the one knob with real leverage. Try a few values
            around the <M>{String.raw`\sqrt{p}`}</M> default.</li>
          <li><strong>Only then</strong> touch <code>min_samples_leaf</code> or <code>max_depth</code>, and only
            if the forest is clearly overfitting a very noisy target.</li>
        </ol>

        <Callout color={TREES} title={<>The good-default advantage</>}>
          A forest with defaults, <code>n_estimators</code> bumped up, and <code>max_features</code> lightly
          tuned is often within a hair of the best you&rsquo;ll ever get from it. That robustness — strong
          results with almost no tuning — is a large part of why the random forest is so many practitioners&rsquo;
          reflexive first model on tabular data.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/random-forests/feature-importance", label: <>← Feature importance in a forest</> }}
          next={{ href: "/learn/random-forests/extra-trees", label: <>Next up · Extremely randomized trees →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", borderBottom: "1.5px solid var(--border-strong)", color: "var(--ink)", fontWeight: 600, fontSize: 12.5 };
const td: React.CSSProperties = { padding: "9px 12px", borderBottom: "1px solid var(--border)", color: "var(--ink)", verticalAlign: "top", lineHeight: 1.55 };
const ol: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
