import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Tuning λ and γ — Manifold",
  description:
    "Kernel ridge has two knobs that interact: λ smooths, γ sets kernel reach. Neither can be tuned alone. The four regimes of the (λ, γ) plane, and how to search it without fooling yourself.",
};

const cell: React.CSSProperties = { flex: "1 1 200px", borderRadius: 12, padding: "13px 15px", border: "1px solid var(--border-strong)" };

export default function TuningPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · in depth", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>Tuning λ and γ</>}
        intro={<>
          Kernel ridge&rsquo;s two dials pull on the same bias–variance rope from different ends. Tune either alone
        and you&rsquo;ll find a false optimum — the sweet spot lives in the <em>joint</em> (λ, γ) plane.
        </>}
      />

      <div className="lesson">
        <h2>Two knobs, one trade-off</h2>
        <ul style={ul}>
          <li><strong><M>{String.raw`\lambda`}</M></strong> smooths by shrinking the coefficients — more λ, flatter fit, lower variance, higher bias.</li>
          <li><strong><M>{String.raw`\gamma`}</M></strong> (RBF width) sets how local the fit is — more γ, spikier and more flexible, higher variance.</li>
        </ul>
        <p>
          They interact because both influence effective flexibility. A large <M>{String.raw`\gamma`}</M> (very
          flexible) can be tamed by a large <M>{String.raw`\lambda`}</M> (heavy smoothing), and vice versa —
          so the &ldquo;right&rdquo; <M>{String.raw`\lambda`}</M> depends on <M>{String.raw`\gamma`}</M> and back
          again. That coupling is why a one-at-a-time search misses the best model.
        </p>

        <h2>The four corners of the (λ, γ) plane</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "1.4rem 0" }}>
          <div style={{ ...cell, background: "color-mix(in srgb, var(--bad, #d9534f) 7%, var(--surface))" }}>
            <div className="font-display" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--bad, #d9534f)", marginBottom: 3 }}>large γ · small λ — overfit</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>Narrow spikes on each point, no smoothing. Interpolates the noise; terrible on new data.</div>
          </div>
          <div style={{ ...cell, background: "color-mix(in srgb, var(--good) 7%, var(--surface))" }}>
            <div className="font-display" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--good)", marginBottom: 3 }}>moderate γ · moderate λ — the sweet spot</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>Reach matched to how fast the function wiggles, with just enough smoothing. The target of tuning.</div>
          </div>
          <div style={{ ...cell, background: "color-mix(in srgb, var(--c-fundamentals) 8%, var(--surface))" }}>
            <div className="font-display" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-fundamentals)", marginBottom: 3 }}>small γ · any λ — underfit</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>Each point&rsquo;s influence is so wide the fit is nearly linear — can&rsquo;t capture real curvature.</div>
          </div>
          <div style={{ ...cell, background: "color-mix(in srgb, var(--c-fundamentals) 8%, var(--surface))" }}>
            <div className="font-display" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-fundamentals)", marginBottom: 3 }}>any γ · large λ — underfit</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>So much shrinkage the coefficients collapse toward zero; the fit flattens to the mean.</div>
          </div>
        </div>

        <h2>Search the grid, on a log scale</h2>
        <p>
          Both parameters act multiplicatively, so search them <strong>logarithmically</strong> — powers of ten,
          not linear steps. A 2-D grid over <M>{String.raw`\lambda`}</M> and <M>{String.raw`\gamma`}</M>, scored by
          cross-validation, reliably finds the joint optimum:
        </p>
        <MathBlock>{String.raw`\lambda \in \{10^{-4}, 10^{-3}, \dots, 10^{1}\}, \quad \gamma \in \{10^{-3}, 10^{-2}, \dots, 10^{1}\}`}</MathBlock>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <Callout color="var(--c-regression)" title={<>A useful γ starting point</>}>
          A good default scale for <M>{String.raw`\gamma`}</M> is <M>{String.raw`1/(m\,\sigma^2)`}</M> — one over the
            number of features times their variance (scikit-learn&rsquo;s <code>gamma="scale"</code>). It centres your
            grid in a sensible place so you&rsquo;re not searching in the dark. Then widen the grid until the CV score
            clearly peaks in the interior, not at an edge.
        </Callout>

        <h2>Don&rsquo;t let the grid fool you</h2>
        <ul style={ul}>
          <li><strong>If the best point sits on the grid boundary, extend it</strong> — the true optimum is probably outside your search.</li>
          <li><strong>Use nested CV (or a held-out test set) for the final estimate</strong> — the grid-search score is optimistic because you picked the winner on it.</li>
          <li><strong>Re-tune after any change to scaling or the kernel</strong> — the whole landscape shifts.</li>
        </ul>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Why can't you tune λ and γ independently?",
              options: ["They interact — the best λ depends on γ and vice versa, so a 1-D search finds a false optimum", "They're actually the same parameter", "γ only affects speed"],
              answer: 0,
              explain: "Both control effective flexibility; a flexible γ can be tamed by a large λ. Only a joint grid captures that coupling.",
            },
            {
              q: "λ and γ should be searched on what kind of scale?",
              options: ["Logarithmic (powers of ten)", "Linear, in steps of 0.1", "Only integer values"],
              answer: 0,
              explain: "Both act multiplicatively, so orders of magnitude matter more than absolute steps. Grid over powers of ten.",
            },
            {
              q: "Your CV best lands at the largest γ in the grid. You should…",
              options: ["Extend the grid — the optimum is likely outside your search range", "Accept it as final", "Set λ to zero"],
              answer: 0,
              explain: "A best-on-the-boundary result means you probably haven't bracketed the true optimum. Widen the grid until the peak is interior.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/choosing-the-kernel", label: <>← Choosing the kernel</> }} next={{ href: "/learn/kernel-ridge-regression/the-computational-cost", label: <>Next up · The computational cost →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
# log-spaced grids for a joint search
lambdas = np.logspace(-4, 1, 6)     # 1e-4 ... 10
gammas  = np.logspace(-3, 1, 5)     # 1e-3 ... 10
# ...evaluate CV score for each (lambda, gamma) pair; pick the best pair`;

const codeLib = `from sklearn.kernel_ridge import KernelRidge
from sklearn.model_selection import GridSearchCV
import numpy as np

grid = GridSearchCV(
    KernelRidge(kernel="rbf"),
    {"alpha": np.logspace(-4, 1, 6), "gamma": np.logspace(-3, 1, 5)},
    cv=5,
).fit(X_train, y_train)

print("best (lambda, gamma):",
      grid.best_params_["alpha"], grid.best_params_["gamma"])`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
