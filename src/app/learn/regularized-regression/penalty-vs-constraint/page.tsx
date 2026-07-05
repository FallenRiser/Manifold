import { Quiz } from "@/components/Quiz";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Penalty vs constraint: two views — Manifold",
  description:
    "Adding a penalty λ‖β‖ is exactly equivalent to constraining ‖β‖ ≤ t. The constraint picture — loss contours meeting a budget region — is the key to understanding why Lasso creates sparsity and Ridge doesn't.",
};

// schematic: elliptical loss contours around the OLS solution, meeting a constraint
// region centred at the origin. Ridge = circle (smooth touch), Lasso = diamond (corner).
const P = 130, cx = 78, cy = 52; // OLS solution (offset from origin at 40,90-ish in svg)
const O = { x: 42, y: 88 };       // origin

function Panel({ kind }: { kind: "ridge" | "lasso" }) {
  // constraint solution: ridge touches the ellipse on the line toward OLS; lasso at the axis corner
  const sol = kind === "ridge" ? { x: 58, y: 70 } : { x: 42, y: 64 }; // lasso lands on the vertical axis (β1=0)
  return (
    <div style={{ flex: 1, minWidth: 150 }}>
      <svg viewBox={`0 0 ${P} ${P}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={P} height={P} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* axes */}
        <line x1={O.x} y1={6} x2={O.x} y2={P - 10} stroke="var(--border-strong)" strokeWidth={0.8} />
        <line x1={10} y1={O.y} x2={P - 6} y2={O.y} stroke="var(--border-strong)" strokeWidth={0.8} />
        <text x={P - 8} y={O.y - 3} fontSize={7} fill="var(--faint)">β₁</text>
        <text x={O.x + 3} y={11} fontSize={7} fill="var(--faint)">β₂</text>
        {/* constraint region centred at origin */}
        {kind === "ridge" ? (
          <circle cx={O.x} cy={O.y} r={24} fill="var(--c-regression)" fillOpacity={0.12} stroke="var(--c-regression)" strokeWidth={1.4} />
        ) : (
          <polygon points={`${O.x},${O.y - 24} ${O.x + 24},${O.y} ${O.x},${O.y + 24} ${O.x - 24},${O.y}`} fill="var(--c-regression)" fillOpacity={0.12} stroke="var(--c-regression)" strokeWidth={1.4} />
        )}
        {/* loss contours (ellipses) around OLS solution */}
        {[10, 18, 27].map((r, i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.6} transform={`rotate(-28 ${cx} ${cy})`} fill="none" stroke="var(--faint)" strokeWidth={1} strokeOpacity={0.8} />
        ))}
        {/* OLS solution */}
        <circle cx={cx} cy={cy} r={2.6} fill="var(--ink)" />
        <text x={cx + 4} y={cy - 3} fontSize={7} fill="var(--ink)">β̂ (OLS)</text>
        {/* constrained solution */}
        <circle cx={sol.x} cy={sol.y} r={3.4} fill="var(--good)" stroke="var(--canvas)" strokeWidth={0.8} />
      </svg>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6, textAlign: "center" }}>
        {kind === "ridge"
          ? "Ridge · circular budget — contour touches on a smooth edge, both βs nonzero"
          : "Lasso · diamond budget — contour touches at a corner, β₁ = 0 (sparse)"}
      </div>
    </div>
  );
}

export default function PenaltyConstraintPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>Penalty vs constraint: two views</>}
        intro={<>
          There are two equivalent ways to write regularization — as a penalty you add, or a budget you must
        stay inside. They give identical answers, but the budget view is the one that finally explains why
        Lasso zeroes coefficients and Ridge doesn&rsquo;t.
        </>}
      />

      <div className="lesson">
        <h2>The two formulations</h2>
        <p>The <strong>penalty</strong> (Lagrangian) form is the one we&rsquo;ve used — minimise fit plus a cost:</p>
        <MathBlock>{String.raw`\min_{\boldsymbol{\beta}} \; \lVert \mathbf{y} - X\boldsymbol{\beta} \rVert^2 + \lambda \lVert \boldsymbol{\beta} \rVert`}</MathBlock>
        <p>The <strong>constraint</strong> form instead caps the coefficient size with a budget <M>{String.raw`t`}</M>:</p>
        <MathBlock>{String.raw`\min_{\boldsymbol{\beta}} \; \lVert \mathbf{y} - X\boldsymbol{\beta} \rVert^2 \quad \text{subject to} \quad \lVert \boldsymbol{\beta} \rVert \le t`}</MathBlock>
        <p>
          By Lagrangian duality these are <strong>equivalent</strong>: for every penalty <M>{String.raw`\lambda`}</M>{" "}
          there is a budget <M>{String.raw`t`}</M> giving exactly the same solution (a larger{" "}
          <M>{String.raw`\lambda`}</M> corresponds to a tighter budget <M>{String.raw`t`}</M>). Same model, two
          lenses.
        </p>

        <h2>The picture that explains everything</h2>
        <p>
          The constraint view is geometric. The squared-error loss forms <strong>elliptical contours</strong>{" "}
          centred on the unconstrained OLS solution <M>{String.raw`\hat{\boldsymbol{\beta}}`}</M>. The constraint
          is a <strong>region</strong> around the origin you must stay inside. The regularized solution is the
          point where the smallest loss contour first <em>touches</em> that region — the best fit you can
          afford on the budget.
        </p>
        <p>The shape of the region is set by the norm, and that shape is everything:</p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <div style={{ display: "flex", gap: 14 }}>
            <Panel kind="ridge" />
            <Panel kind="lasso" />
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            The contours (grey) and OLS solution (β̂) are identical in both panels. Only the budget region
            differs — a smooth <strong>circle</strong> for Ridge (L2), a pointy <strong>diamond</strong> for
            Lasso (L1). Where the contour first kisses each region is the regularized solution (green).
          </div>
        </div>

        <h2>Why Lasso is sparse and Ridge isn&rsquo;t</h2>
        <p>
          A diamond has <strong>corners that sit exactly on the axes</strong> — and at a corner, one
          coordinate is zero. Because the corners stick out, an expanding contour is very likely to touch the
          diamond <em>there</em>, snapping that coefficient to exactly zero. The circle has no corners; a
          contour touches it on a smooth arc, at a point where both coefficients are small but{" "}
          <strong>nonzero</strong>. That single geometric difference is the entire reason Lasso performs
          feature selection and Ridge only shrinks.
        </p>

        <Callout color="var(--c-regression)" title={<>The pattern generalises</>}>
          The &ldquo;pointiness&rdquo; of the L1 ball is what creates sparsity, and it scales: in higher dimensions
            the L1 ball has edges and faces lying on coordinate subspaces, so Lasso can zero out many
            coefficients at once. Norms between L1 and L2 (used by elastic-net) round the corners partway,
            trading some sparsity for stability. Keep this picture in mind — it&rsquo;s the geometric heart of the
            whole track.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "The penalty form (min MSE + λ‖w‖²) and the constraint form (min MSE subject to ‖w‖² ≤ t) are…",
              options: ["Equivalent — every λ corresponds to some budget t", "Two genuinely different models", "Equal only for the Lasso"],
              answer: 0,
              explain: "They're Lagrangian duals: dialling λ traces out the same solutions as dialling t. The penalty view is how you compute; the constraint view is how you should picture it.",
            },
            {
              q: "As λ → 0, the regularized solution approaches…",
              options: ["Ordinary least squares", "The all-zero model", "It diverges"],
              answer: 0,
              explain: "Zero penalty means nothing restrains the fit — you recover OLS exactly. At the other extreme, λ → ∞ crushes every coefficient toward zero.",
            },
            {
              q: "The reason shrinking coefficients helps at all is that it trades…",
              options: ["A little bias for a large reduction in variance", "Training speed for test accuracy", "Interpretability for flexibility"],
              answer: 0,
              explain: "Slightly-too-small coefficients are systematically wrong (bias) but far less sensitive to which sample you drew (variance), and on new data the variance term is usually what's killing you.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/regularized-regression/shrinkage-the-core-idea", label: <>← Shrinkage: the core idea</> }} next={{ href: "/learn/regularized-regression/ridge-regression", label: <>Next up · Ridge regression →</> }} />
      </div>
    </article>
  );
}

