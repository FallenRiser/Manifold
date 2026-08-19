import Link from "next/link";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "When to use SVR — Manifold",
  description:
    "A practitioner's guide to reaching for support vector regression: the problems where its sparsity and robustness shine, the ones where kernel ridge or another model fits better, and the pre-flight checklist.",
};

const col: React.CSSProperties = { flex: "1 1 280px", borderRadius: 14, padding: "16px 18px" };
const li: React.CSSProperties = { marginBottom: 8, lineHeight: 1.55 };

export default function WhenToUseSVRPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · in practice", color: "var(--c-regression)" }]}
        time="about 6 minutes"
        title={<>When to use SVR</>}
        intro={<>
          SVR is a specialist, not a default. It earns its place when you want a compact, robust nonlinear
        regressor and can afford to tune three knobs — and it&rsquo;s the wrong tool when you need scale,
        uncertainty, or the simplest possible fit.
        </>}
      />

      <div className="lesson">
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "0.6rem 0 1.4rem" }}>
          <div style={{ ...col, background: "color-mix(in srgb, var(--good) 8%, var(--surface))", border: "1px solid color-mix(in srgb, var(--good) 28%, var(--border))" }}>
            <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--good)", marginBottom: 8 }}>Reach for SVR when…</div>
            <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: 14, color: "var(--muted)" }}>
              <li style={li}>You want a <strong>compact model</strong> — only support vectors are stored, so prediction is cheaper than dense kernel ridge.</li>
              <li style={li}>The data has <strong>outliers</strong> — the ε-tube and linear tails cap their influence.</li>
              <li style={li}>You can define a <strong>tolerance</strong> — errors below ε genuinely don&rsquo;t matter to you.</li>
              <li style={li}>The relationship is <strong>nonlinear</strong> and <M>{String.raw`n`}</M> is small-to-moderate (thousands, not millions).</li>
              <li style={li}>You have <strong>high-dimensional / sparse features</strong> (e.g. text) — linear SVR is a strong, robust baseline.</li>
            </ul>
          </div>
          <div style={{ ...col, background: "color-mix(in srgb, var(--bad, #d9534f) 8%, var(--surface))", border: "1px solid color-mix(in srgb, var(--bad, #d9534f) 26%, var(--border))" }}>
            <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--bad, #d9534f)", marginBottom: 8 }}>Look elsewhere when…</div>
            <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: 14, color: "var(--muted)" }}>
              <li style={li}><strong>You need uncertainty</strong> — SVR gives no error bars; use a <em>Gaussian process</em>.</li>
              <li style={li}><strong>n is very large</strong> — the QP scales poorly; use linear models, trees/boosting, or kernel approximations.</li>
              <li style={li}><strong>You want the simplest thing</strong> — <Link href="/learn/kernel-ridge-regression" style={inlineLink}>kernel ridge</Link> is closed-form with one fewer knob.</li>
              <li style={li}><strong>Peak accuracy on clean tabular data</strong> — gradient boosting usually wins and needs less scaling care.</li>
              <li style={li}><strong>You can&rsquo;t afford to tune</strong> — three interacting knobs (C, ε, γ) need a real grid search.</li>
            </ul>
          </div>
        </div>

        <Callout color="var(--c-regression)" title={<>The pre-flight checklist</>}>
          Before trusting an SVR: (1) <strong>standardise</strong> features (and usually the target — ε is in{" "}
            <M>{String.raw`y`}</M>&rsquo;s units); (2) <strong>grid-search C and γ</strong> on a log scale, then refine
            ε near the noise level; (3) check the <strong>support-vector fraction</strong> is well below 100%
            (else ε is too small / γ too large); (4) confirm the CV optimum is <strong>interior</strong> to your
            grid; (5) validate on a genuinely held-out set. Skip these and SVR will look worse than it is.
        </Callout>

        <h2>SVR&rsquo;s place in the toolbox</h2>
        <p>
          Think of the regression family as a ladder of assumptions. <strong>Linear/ridge</strong> assumes a
          plane. <strong>Basis/polynomial</strong> assumes a known curved form. <strong>Kernel ridge</strong>
          assumes only smoothness, densely. <strong>SVR</strong> assumes smoothness too, but keeps only the points
          that matter and forgives small errors. Each rung adds flexibility and cost; SVR sits near the top,
          justified when its sparsity or robustness is worth the extra tuning.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Which situation most favours SVR over kernel ridge?",
              options: ["You want a compact, outlier-robust model and can define an error tolerance", "You need calibrated uncertainty", "You have ten million rows"],
              answer: 0,
              explain: "Sparsity, robustness, and an explicit ε-tolerance are SVR's edge. Uncertainty needs a GP; huge n needs a different family.",
            },
            {
              q: "You need prediction error bars alongside the estimate. Best choice?",
              options: ["A Gaussian process — SVR provides no uncertainty", "SVR with small ε", "SVR with large C"],
              answer: 0,
              explain: "SVR outputs point predictions only. For calibrated uncertainty, use a GP (kernel ridge's probabilistic twin).",
            },
            {
              q: "A red flag that your SVR is poorly configured is…",
              options: ["Nearly 100% of points are support vectors", "It has a small support-vector fraction", "It trained quickly"],
              answer: 0,
              explain: "If almost everything is a support vector, the model isn't sparse and is likely overfitting — usually ε too small or γ too large.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/scaling-svr-to-large-n", label: <>← Scaling SVR to large n</> }} next={{ href: "/learn/support-vector-regression/worked-example", label: <>Next up · A worked example →</> }} />
      </div>
    </article>
  );
}

const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
