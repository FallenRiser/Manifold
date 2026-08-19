import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { SVRKnobsLab } from "@/components/labs/SVRKnobsLab";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Hyperparameters: C, ε, γ — Manifold",
  description:
    "SVR has three knobs that all interact: C (regularisation), ε (tube width and sparsity), and γ (kernel reach). What each does, how they pull on each other, and how to tune them without getting lost.",
};

const th: React.CSSProperties = { textAlign: "left", padding: "9px 12px", fontSize: 12.5, fontWeight: 600, borderBottom: "2px solid var(--border-strong)" };
const rowh: React.CSSProperties = { textAlign: "left", padding: "9px 12px", fontSize: 13, color: "var(--ink)", fontWeight: 600, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "9px 12px", fontSize: 13, color: "var(--muted)", borderBottom: "1px solid var(--border)", verticalAlign: "top" };

export default function HyperparametersPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · the mechanics", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>Hyperparameters: C, ε, γ</>}
        intro={<>
          SVR&rsquo;s flexibility comes with three knobs — one more than kernel ridge. Each has a distinct job, but
        they interact, so tuning is a joint search. Here&rsquo;s what each controls and how to find a good setting.
        </>}
      />

      <div className="lesson">
        <h2>The three knobs at a glance</h2>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10 }}>
            <thead>
              <tr><th style={th}>Knob</th><th style={th}>Controls</th><th style={th}>Turn it up →</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style={rowh}>C</td>
                <td style={td}>Regularisation — penalty for tube violations</td>
                <td style={td}>Tighter fit, lower bias, higher variance (can overfit). C is inverse of λ.</td>
              </tr>
              <tr>
                <td style={rowh}>ε</td>
                <td style={td}>Tube width — how large an error is &ldquo;free&rdquo;</td>
                <td style={td}>Wider dead zone → fewer support vectors, sparser &amp; flatter, coarser fit.</td>
              </tr>
              <tr>
                <td style={rowh}>γ</td>
                <td style={td}>RBF kernel reach — how local each point is</td>
                <td style={td}>Narrower, spikier fit; too high overfits, too low underfits (nearly linear).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Reading about three interacting knobs only gets you so far — turn them yourself. This is a real
          ε-SVR, solved in your browser on nonlinear data with one planted outlier. Change any knob and watch the
          fit, the tube, and the support-vector counts respond:
        </p>
        <SVRKnobsLab />

        <h2>How they pull on each other</h2>
        <ul style={ul}>
          <li><strong>C ↔ γ</strong> — both raise effective flexibility, so a large γ often needs a smaller C to stay controlled. The classic SVM/SVR interaction: search them <em>together</em>.</li>
          <li><strong>ε ↔ C</strong> — ε decides how many points can be violations at all; C decides how much those violations cost. Together they set the support-vector count and the fit&rsquo;s tightness.</li>
          <li><strong>ε ↔ noise</strong> — a good rule of thumb ties ε to the noise level: roughly the standard deviation of the target noise, so the tube forgives errors the data can&rsquo;t explain anyway.</li>
        </ul>

        <Callout color="var(--c-regression)" title={<>Sensible starting points</>}>
          Begin from scikit-learn&rsquo;s defaults and widen: <M>{String.raw`\gamma`}</M> = <code>"scale"</code>
            (<M>{String.raw`1/(m\,\sigma^2)`}</M>), <M>{String.raw`C = 1`}</M>, <M>{String.raw`\varepsilon = 0.1`}</M>
            (on standardised targets). Then grid-search <M>{String.raw`C`}</M> and <M>{String.raw`\gamma`}</M> on a
            log scale first — they matter most — and refine <M>{String.raw`\varepsilon`}</M> around the noise
            level. Always <strong>scale features and (often) the target</strong> before tuning, since ε lives in
            the units of <M>{String.raw`y`}</M>.
        </Callout>

        <h2>Tuning in practice</h2>
        <p>
          Log-spaced grid over <M>{String.raw`C`}</M> and <M>{String.raw`\gamma`}</M>, a small set of{" "}
          <M>{String.raw`\varepsilon`}</M> values, scored by cross-validation with a regression metric:
        </p>
        <CodeBlock fromScratch={code} />

        <h2>Diagnostics from the fitted model</h2>
        <ul style={ul}>
          <li><strong>Almost every point is a support vector?</strong> ε is likely too small or γ too large — the model is memorising, not generalising.</li>
          <li><strong>Best params on a grid edge?</strong> Extend the grid; the optimum is probably outside it.</li>
          <li><strong>Underfitting?</strong> Raise C or γ (more flexibility) or lower ε (demand a tighter fit).</li>
        </ul>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Which SVR hyperparameter has no analogue in kernel ridge?",
              options: ["ε — the tube width that sets the free-error tolerance and sparsity", "C", "γ"],
              answer: 0,
              explain: "Kernel ridge has regularisation (λ ≈ 1/C) and a kernel width (γ), but no tube. ε is unique to the ε-insensitive loss.",
            },
            {
              q: "A good rule of thumb for setting ε is…",
              options: ["Tie it to the target's noise level (≈ its standard deviation)", "Always set it to zero", "Make it as large as possible"],
              answer: 0,
              explain: "Forgiving errors on the scale of the noise avoids fitting randomness, while keeping the tube tight enough to capture signal.",
            },
            {
              q: "You find nearly every training point is a support vector. Likely fix?",
              options: ["Increase ε or decrease γ — the model is too flexible / the tube too narrow", "Increase C", "Remove the kernel"],
              answer: 0,
              explain: "A model that keeps everyone isn't sparse and is probably overfitting. Widen the tube or reduce kernel reach.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/kernels-for-svr", label: <>← Kernels for SVR</> }} next={{ href: "/learn/support-vector-regression/nu-svr", label: <>Next up · ν-SVR: controlling the support vectors →</> }} />
      </div>
    </article>
  );
}

const code = `from sklearn.svm import SVR
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV
import numpy as np

pipe = make_pipeline(StandardScaler(), SVR(kernel="rbf"))
grid = GridSearchCV(pipe, {
    "svr__C":       np.logspace(-1, 2, 4),    # 0.1 ... 100
    "svr__gamma":   np.logspace(-3, 0, 4),    # 1e-3 ... 1
    "svr__epsilon": [0.05, 0.1, 0.5],
}, cv=5).fit(X_train, y_train)
print(grid.best_params_)`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
