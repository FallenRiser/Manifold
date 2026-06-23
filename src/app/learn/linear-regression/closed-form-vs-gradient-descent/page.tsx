import Link from "next/link";
import { ClosedFormVsGDLab } from "@/components/labs/ClosedFormVsGDLab";
import { CodeBlock } from "@/components/CodeBlock";

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 50)
y = 3 + 2*x + rng.normal(scale=1.5, size=50)
X = np.column_stack([np.ones_like(x), x])

# closed form: solve the normal equation in one shot
theta_cf = np.linalg.solve(X.T @ X, X.T @ y)

# gradient descent: iterate to the same place
theta_gd = np.zeros(2)
for _ in range(5000):
    theta_gd -= 0.01 * (2/len(y)) * X.T @ (X @ theta_gd - y)

print("closed form:     ", theta_cf.round(3))
print("gradient descent:", theta_gd.round(3))   # they converge to the same answer`;

const codeLib = `import numpy as np
from sklearn.linear_model import LinearRegression, SGDRegressor

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 50)
y = 3 + 2*x + rng.normal(scale=1.5, size=50)
Xc = x.reshape(-1, 1)

cf = LinearRegression().fit(Xc, y)                      # closed form internally
gd = SGDRegressor(eta0=0.01, max_iter=5000, tol=None).fit(Xc, y)  # iterative

print("LinearRegression:", round(float(cf.intercept_), 3), round(float(cf.coef_[0]), 3))
print("SGDRegressor:    ", round(float(gd.intercept_[0]), 3), round(float(gd.coef_[0]), 3))`;

export const metadata = {
  title: "Closed-form vs gradient descent — Manifold",
  description:
    "Two algorithms, one answer. The normal equation is exact and instant; gradient descent is approximate and scalable. Here's how to think about the choice.",
};

export default function ClosedFormVsGDPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Core idea</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1
        className="font-serif"
        style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}
      >
        Closed-form vs gradient descent
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        You now know both roads to the best-fit line. One finds the answer in a
        single step; the other wanders toward it iteratively. They reach the same
        destination — but in very different ways.
      </p>

      <div className="lesson">
        <p>
          Run the lab below. Toggle both lines onto the scatter. Let gradient
          descent run until it converges. Notice: they land in exactly the same
          place. The normal equation wins on elegance; gradient descent wins on
          scale.
        </p>

        <ClosedFormVsGDLab />

        <h2>Why they always agree (for linear regression)</h2>
        <p>
          The loss surface for linear regression is a perfect convex bowl —
          quadratic in the parameters, exactly one minimum. The normal equation
          solves for the point where the gradient is zero (the bowl's floor).
          Gradient descent, given enough steps, rolls to that same floor.
          Different paths, identical destination.
        </p>
        <p>
          This agreement breaks down the moment the model is non-linear. A
          neural network has no closed form — its loss surface is full of saddle
          points and local minima. Gradient descent is the only general-purpose
          tool that survives the non-linear world.
        </p>

        <h2>The key trade-offs</h2>
        <div style={compGrid}>
          <TradeoffRow
            topic="Computational cost"
            ne="O(Np²) to form XᵀX + O(p³) to invert it"
            gd="O(Np) per step · runs for T steps"
            winner="ne"
            winnerNote="when p is small"
          />
          <TradeoffRow
            topic="Memory"
            ne="Must hold the full X matrix in RAM"
            gd="Can process data in mini-batches; never loads all at once"
            winner="gd"
            winnerNote="when N is huge"
          />
          <TradeoffRow
            topic="Hyperparameters"
            ne="None — it's a formula"
            gd="Learning rate α, batch size, stopping rule"
            winner="ne"
            winnerNote="for simplicity"
          />
          <TradeoffRow
            topic="Precision"
            ne="Exact (up to floating-point)"
            gd="Approximate; depends on convergence"
            winner="ne"
            winnerNote="always"
          />
          <TradeoffRow
            topic="Generalises to deep learning?"
            ne="No — requires a quadratic, convex loss"
            gd="Yes — works on any differentiable loss"
            winner="gd"
            winnerNote="for everything non-linear"
          />
          <TradeoffRow
            topic="Online / streaming data"
            ne="No — needs all data to form XᵀX"
            gd="Yes — update parameters as new data arrives"
            winner="gd"
            winnerNote="for production systems"
          />
        </div>

        <h2>The rule of thumb</h2>
        <div style={decisionBox}>
          <DecisionBranch
            condition="p < ~10,000 and data fits in RAM"
            action="Use the normal equation"
            color="var(--brand)"
          />
          <DecisionBranch
            condition="p is large, N is huge, or the model is non-linear"
            action="Use gradient descent (or an adaptive variant)"
            color="var(--c-fundamentals)"
          />
          <DecisionBranch
            condition="You need regularisation (Ridge / Lasso)"
            action="Normal equation still works for Ridge (add λI inside); Lasso requires iterative methods"
            color="var(--good)"
          />
        </div>

        <h2>What you just learned</h2>
        <p>
          You've now seen linear regression from three angles: the geometric
          intuition (the line of best fit), the optimisation story (gradient
          descent rolling downhill), and the algebraic shortcut (the normal
          equation). Each one illuminates a different facet of the same
          underlying truth — and together they give you a mental model that
          transfers to far more complex models.
        </p>
        <p>
          Next, we scale up: one feature becomes many, and the line becomes a
          hyperplane. The math changes only in notation; the ideas stay exactly
          the same.
        </p>

        <div style={callout}>
          <div
            className="font-display"
            style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}
          >
            Interview-grade answer
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            "When would you use the normal equation vs gradient descent?" —
            The normal equation is O(p³) in the number of features due to the
            matrix inversion. It's exact and requires no hyperparameters, making
            it ideal when p is small (e.g., fewer than ~10,000 features) and the
            data fits in memory. For large p, large N, non-linear models, or
            streaming data, gradient descent is the only practical option —
            it scales linearly with N per step and generalises to any
            differentiable loss.
          </p>
        </div>

        <h2>Both, side by side</h2>
        <p>
          Solve the normal equation in one line, then grind to the same coefficients
          with gradient descent. The library mirrors the split: <code>LinearRegression</code>
          {" "}is closed-form, <code>SGDRegressor</code> is iterative.
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
          <Link href="/learn/linear-regression/the-normal-equation" style={navLink}>
            ← The normal equation
          </Link>
          <Link href="/learn/linear-regression/multiple-linear-regression" style={navLink}>
            Next up · Multiple linear regression →
          </Link>
        </div>
      </div>
    </article>
  );
}

function TradeoffRow({
  topic, ne, gd, winner, winnerNote,
}: {
  topic: string; ne: string; gd: string; winner: "ne" | "gd"; winnerNote: string;
}) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--border)" }}>
      <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
        {topic}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Cell
          label="Normal equation"
          val={ne}
          highlight={winner === "ne"}
          color="var(--brand)"
        />
        <Cell
          label="Gradient descent"
          val={gd}
          highlight={winner === "gd"}
          color="var(--c-fundamentals)"
        />
      </div>
      <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--faint)" }}>
        Prefer {winner === "ne" ? "closed-form" : "gradient descent"} · {winnerNote}
      </div>
    </div>
  );
}

function Cell({ label, val, highlight, color }: { label: string; val: string; highlight: boolean; color: string }) {
  return (
    <div style={{
      background: highlight ? `color-mix(in srgb, ${color} 8%, var(--surface))` : "transparent",
      border: highlight ? `1.5px solid color-mix(in srgb, ${color} 25%, var(--border))` : "1px solid transparent",
      borderRadius: 8, padding: "7px 10px",
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>{val}</div>
    </div>
  );
}

function DecisionBranch({ condition, action, color }: { condition: string; action: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: 4, flexShrink: 0, borderRadius: 2, background: color, alignSelf: "stretch", minHeight: 36 }} />
      <div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 3 }}>if: <em>{condition}</em></div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>→ {action}</div>
      </div>
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

const compGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr", gap: 10, margin: "1.4rem 0" };
const decisionBox: React.CSSProperties = { background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: "4px 14px", margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };

const callout: React.CSSProperties = {
  background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))",
  border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))",
  borderRadius: 12,
  padding: "13px 15px",
  margin: "1.8rem 0 0",
};
