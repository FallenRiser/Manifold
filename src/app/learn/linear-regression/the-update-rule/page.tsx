import Link from "next/link";
import { UpdateRuleLab } from "@/components/labs/UpdateRuleLab";
import { CodeBlock } from "@/components/CodeBlock";

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 50)
y = 3 + 2*x + rng.normal(scale=1.5, size=50)
X = np.column_stack([np.ones_like(x), x])

theta = np.zeros(2)
lr = 0.01
for step in range(2000):
    grad  = (2/len(y)) * X.T @ (X @ theta - y)   # gradient of the MSE
    theta = theta - lr * grad                    # <-- the update rule
print("intercept, slope:", theta.round(3))       # ~ [3, 2]`;

const codeLib = `import numpy as np
from sklearn.linear_model import SGDRegressor

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 50)
y = 3 + 2*x + rng.normal(scale=1.5, size=50)

# SGDRegressor applies the same  theta := theta - lr * grad  rule internally
model = SGDRegressor(learning_rate="constant", eta0=0.01, max_iter=2000, tol=None)
model.fit(x.reshape(-1, 1), y)
print("intercept, slope:", round(float(model.intercept_[0]), 3),
      round(float(model.coef_[0]), 3))`;

export const metadata = {
  title: "The update rule — Manifold",
  description:
    "θ := θ − α∇L. One line of math. Every training loop ever written. Here's what each term actually means and why the rule works.",
};

export default function UpdateRulePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Core idea</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1
        className="font-serif"
        style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}
      >
        The update rule
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        You've watched the ball roll downhill and understood what a gradient is.
        Now let's write it as math — one line that runs inside every training
        loop ever written.
      </p>

      <div className="lesson">
        <p>
          The whole of gradient descent collapses to a single equation:
        </p>

        <div
          style={{
            background: "var(--canvas)",
            border: "1px solid var(--border-strong)",
            borderRadius: 14,
            padding: "18px 22px",
            margin: "1.4rem 0",
            textAlign: "center",
            fontFamily: "ui-monospace, monospace",
            fontSize: 22,
            letterSpacing: "0.01em",
            color: "var(--ink)",
          }}
        >
          θ{" "}
          <span style={{ color: "var(--brand-2)" }}>:=</span> θ{" "}
          <span style={{ color: "var(--muted)" }}>−</span>{" "}
          <span style={{ color: "var(--c-fundamentals)" }}>α</span>{" "}
          <span style={{ color: "var(--bad)" }}>∇L(θ)</span>
        </div>

        <p>
          Read it left to right: the <strong>new value of θ</strong> is the old
          value, minus a small fraction of the gradient. That's it. Run this
          once per step, for every parameter, and you have gradient descent.
        </p>

        <h2>Unpacking the symbols</h2>
        <div style={glossaryGrid}>
          <GlossaryCard
            symbol="θ"
            color="var(--ink)"
            name="Parameters"
            body="The numbers being trained — for a line, that's the slope m and the intercept b. After training, θ holds the best values we found."
          />
          <GlossaryCard
            symbol=":="
            color="var(--brand-2)"
            name="Assignment"
            body="Not equals — assignment. The right side is computed, then stored back into θ. It's a loop, not a proof."
          />
          <GlossaryCard
            symbol="α"
            color="var(--c-fundamentals)"
            name="Learning rate"
            body="A small positive number you choose — typically 0.001 to 0.5. It controls how far we slide in the gradient direction each step."
          />
          <GlossaryCard
            symbol="∇L"
            color="var(--bad)"
            name="Gradient"
            body="The vector of partial derivatives of the loss with respect to each parameter. It points uphill; subtracting it takes us downhill."
          />
        </div>

        <h2>Try it yourself</h2>
        <p>
          Hover each term in the equation to see what it represents numerically.
          Then hit <strong>Step</strong> to watch one update happen — the table
          beneath records every number so you can verify the arithmetic yourself.
        </p>

        <UpdateRuleLab />

        <h2>Why subtract the gradient?</h2>
        <p>
          The gradient points in the direction of <em>steepest ascent</em> — the
          way to make the loss grow fastest. We want the loss to shrink, so we go
          the opposite way. Subtracting the gradient moves us downhill. The
          magnitude of the gradient naturally shrinks as we approach the minimum
          (the surface flattens out), so the steps automatically get smaller
          without any extra bookkeeping.
        </p>

        <h2>One rule, two parameters</h2>
        <p>
          The equation looks like a scalar, but θ is a vector. For our line, it
          applies once for m and once for b, in parallel:
        </p>
        <div
          style={{
            background: "var(--canvas)",
            borderRadius: 10,
            padding: "12px 16px",
            margin: "0.8rem 0 1.2rem",
            fontFamily: "ui-monospace, monospace",
            fontSize: 13.5,
            lineHeight: 1.9,
            color: "var(--ink)",
          }}
        >
          <div>
            m{" "}:={" "}
            <span style={{ color: "var(--ink)" }}>m</span>{" "}
            <span style={{ color: "var(--muted)" }}>−</span>{" "}
            <span style={{ color: "var(--c-fundamentals)" }}>α</span>{" "}
            <span style={{ color: "var(--bad)" }}>· ∂L/∂m</span>
          </div>
          <div>
            b{" "}:={" "}
            <span style={{ color: "var(--ink)" }}>b</span>{" "}
            <span style={{ color: "var(--muted)" }}>−</span>{" "}
            <span style={{ color: "var(--c-fundamentals)" }}>α</span>{" "}
            <span style={{ color: "var(--bad)" }}>· ∂L/∂b</span>
          </div>
        </div>
        <p>
          Notice both updates happen using the gradients computed at the{" "}
          <em>current</em> θ, not the already-updated values. This simultaneous
          update is important — it's how the math was derived and how every
          correct implementation works.
        </p>

        <div style={callout}>
          <div
            className="font-display"
            style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}
          >
            Interview-grade answer
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            "What is the gradient descent update rule?" — At each step, compute
            the gradient of the loss with respect to each parameter, then
            subtract a learning-rate-scaled copy of that gradient from the
            current parameter. Repeat until convergence. The key insight: the
            gradient points uphill, so subtracting it is always a downhill move.
          </p>
        </div>

        <h2>Run the update rule</h2>
        <p>
          A few lines of NumPy: compute the gradient, subtract a scaled copy,
          repeat. The library version runs the identical rule for you.
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          <Link href="/learn/linear-regression/what-is-a-gradient" style={navLink}>
            ← What is a gradient?
          </Link>
          <Link href="/learn/linear-regression/learning-rate" style={navLink}>
            Next up · Learning rate →
          </Link>
        </div>
      </div>
    </article>
  );
}

function GlossaryCard({
  symbol,
  color,
  name,
  body,
}: {
  symbol: string;
  color: string;
  name: string;
  body: string;
}) {
  return (
    <div
      style={{
        background: `color-mix(in srgb, ${color} 6%, var(--surface-2))`,
        border: `1px solid color-mix(in srgb, ${color} 18%, var(--border))`,
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 22,
            fontWeight: 700,
            color,
          }}
        >
          {symbol}
        </span>
        <span
          className="font-display"
          style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}
        >
          {name}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
        {body}
      </p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    background: `color-mix(in srgb, ${color} 13%, var(--surface))`,
    color,
    fontSize: 12,
    padding: "3px 10px",
    borderRadius: 999,
  };
}

const glossaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 12,
  margin: "1.4rem 0",
};

const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };

const callout: React.CSSProperties = {
  background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))",
  border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))",
  borderRadius: 12,
  padding: "13px 15px",
  margin: "1.8rem 0 0",
};
