import Link from "next/link";
import { MathBlock } from "@/components/Math";

export const metadata = {
  title: "Linearity — Manifold",
  description:
    "The linearity assumption says the relationship between features and outcome is additive and proportional. Here's how to detect and fix violations.",
};

export default function LinearityPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--warn)")}>Assumptions</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Linearity
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        The most foundational assumption: the expected value of y changes
        proportionally with each feature. Violate it, and your model is fitting
        the wrong shape — and every prediction is systematically wrong.
      </p>

      <div className="lesson">
        <h2>What it actually says</h2>
        <p>
          The linearity assumption is that the <strong>conditional mean</strong> of
          y is a linear function of the predictors:
        </p>
        <MathBlock>{String.raw`\mathbb{E}[\,y \mid X\,] = X\theta`}</MathBlock>
        <p>
          It does <em>not</em> say the relationship between raw x and y must be
          straight. Remember: we can add x², log(x), or x₁·x₂ as features — the
          model remains "linear" because it's linear in the <em>parameters</em>
          θ, not in the original x.
        </p>

        <h2>How to detect it</h2>
        <div style={methodsGrid}>
          <MethodCard title="Scatter plot (before fitting)" body="Plot y against each predictor. A clear curve means a non-linear relationship. This is your first check before even fitting." icon="📊" />
          <MethodCard title="Residual-vs-fitted plot" body="After fitting, plot residuals against fitted values. A horizontal random scatter = linearity satisfied. A U-shape or arch = non-linear pattern remaining." icon="📉" />
          <MethodCard title="Partial regression plots" body="Plot the residuals of y (after removing other predictors) against the residuals of xⱼ. The slope shows xⱼ's true marginal relationship with y." icon="🔍" />
        </div>

        <h2>What the residual-vs-fitted plot looks like</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, margin: "1.2rem 0" }}>
          <ResidPlot good label="✓ Linearity satisfied" caption="Residuals scattered randomly around zero — no curve, no pattern." />
          <ResidPlot good={false} label="✗ Arch pattern" caption="Residuals curve upward then downward — the true relationship bends, and the linear model is systematically wrong in the middle." />
        </div>

        <h2>How to fix it</h2>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>
            <strong style={{ color: "var(--ink)" }}>Add polynomial terms.</strong>{" "}
            If the scatter shows a simple curve, add x² or x³. Usually a degree-2 or 3 term is enough.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Transform the predictor or outcome.</strong>{" "}
            Log(x) linearises exponential growth. √y can tame a right-skewed outcome. Box-Cox transformations generalise both.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Use a non-linear model.</strong>{" "}
            If the relationship is genuinely complex — tree-shaped, with interactions, or highly non-monotone — consider decision trees, GAMs, or neural networks instead.
          </li>
        </ul>

        <h2>Why it matters for predictions (not just inference)</h2>
        <p>
          Unlike most other assumptions, violating linearity biases your point
          predictions — not just the standard errors. If the true relationship
          bends and you fit a straight line, predictions at the extremes are
          systematically wrong. The model doesn't know it's wrong; it confidently
          extrapolates a lie.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            Quick check sequence
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            1. Scatter each predictor against y — spot obvious curves.{" "}
            2. Fit the model and plot residuals vs fitted — look for an arch.{" "}
            3. If an arch exists, add a squared term for the offending predictor and recheck.{" "}
            4. Repeat until residuals look random.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/the-five-assumptions" style={navLink}>← The five assumptions</Link>
          <Link href="/learn/linear-regression/independence-of-errors" style={navLink}>Next up · Independence of errors →</Link>
        </div>
      </div>
    </article>
  );
}

function MethodCard({ title, body, icon }: { title: string; body: string; icon: string }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "13px 15px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function ResidPlot({ good, label, caption }: { good: boolean; label: string; caption: string }) {
  const W = 200, H = 120;
  const pts = Array.from({ length: 28 }, (_, i) => {
    const fx = 20 + (i / 27) * (W - 40);
    const fxNorm = i / 27;
    const base = good ? 0 : (fxNorm - 0.5) * 2 * 28;
    const noise = (Math.sin(i * 2.1) * 12 + Math.cos(i * 1.3) * 9);
    return { x: fx, y: H / 2 + base + noise };
  });
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: good ? "var(--good)" : "var(--bad)", marginBottom: 4 }}>{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={20} y1={H / 2} x2={W - 20} y2={H / 2} stroke="var(--brand)" strokeWidth={1.2} strokeDasharray="4 3" strokeOpacity={0.7} />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={Math.max(8, Math.min(H - 8, p.y))} r={2.8}
            fill={good ? "var(--c-regression)" : "var(--warn)"} fillOpacity={0.85} />
        ))}
        <text x={W / 2} y={H - 2} fontSize={8.5} fill="var(--faint)" textAnchor="middle">fitted →</text>
      </svg>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 5, lineHeight: 1.5 }}>{caption}</div>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}const methodsGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
