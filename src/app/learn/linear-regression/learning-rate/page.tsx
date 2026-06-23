import Link from "next/link";
import { LearningRateLab } from "@/components/labs/LearningRateLab";
import { CodeBlock } from "@/components/CodeBlock";

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 50)
y = 3 + 2*x + rng.normal(scale=1.5, size=50)
X = np.column_stack([np.ones_like(x), x])

def final_mse(lr, steps=60):
    theta = np.zeros(2)
    for _ in range(steps):
        grad  = (2/len(y)) * X.T @ (X @ theta - y)
        theta = theta - lr * grad
    return np.mean((X @ theta - y)**2)

for lr in [0.001, 0.02, 0.12, 0.5]:
    mse = final_mse(lr)
    tag = "diverged!" if (np.isnan(mse) or mse > 1e6) else f"MSE {mse:.3f}"
    print(f"lr = {lr:<6}  ->  {tag}")    # too small crawls, too big explodes`;

const codeLib = `import numpy as np
from sklearn.linear_model import SGDRegressor

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 50)
y = 3 + 2*x + rng.normal(scale=1.5, size=50)

# sklearn exposes the learning rate as eta0 (with an optional schedule)
for eta in [0.001, 0.02, 0.12]:
    m = SGDRegressor(learning_rate="constant", eta0=eta, max_iter=60, tol=None)
    m.fit(x.reshape(-1, 1), y)
    mse = np.mean((m.predict(x.reshape(-1, 1)) - y)**2)
    print(f"eta0 = {eta:<6} ->  MSE {mse:.3f}")`;

export const metadata = {
  title: "Learning rate — Manifold",
  description:
    "The learning rate α is the single most important hyperparameter in gradient descent. Too small and you crawl; too large and you diverge. Here's the intuition.",
};

export default function LearningRatePage() {
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
        Learning rate
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        The update rule has one number you have to choose yourself — α, the
        learning rate. It's a small multiplier, but getting it wrong is the
        single most common reason gradient descent fails.
      </p>

      <div className="lesson">
        <p>
          Remember the update rule:{" "}
          <code>θ := θ − α × ∇L</code>. The gradient tells us{" "}
          <em>which way</em> to step. The learning rate tells us{" "}
          <em>how far</em>. Too small and you'll converge, but it'll take
          forever. Too large and each step overshoots the minimum, bouncing
          higher and higher until the loss explodes.
        </p>

        <h2>Three fates</h2>
        <p>
          Watch the same starting point, same data — only α changes. Hit{" "}
          <strong>Replay</strong> to run all three simultaneously and see where
          each one ends up.
        </p>

        <LearningRateLab />

        <h2>Why divergence happens</h2>
        <p>
          Imagine the loss surface as a valley with steep walls. With a small
          step you slide gently downhill. With a giant step you jump clear across
          the valley, land on the far wall higher than you started, then jump
          back — even higher. Each bounce takes you further from the bottom. The
          loss isn't falling; it's exploding. In code you'll see this as{" "}
          <code>NaN</code> or <code>inf</code> loss.
        </p>
        <p>
          The formal condition for convergence (in a convex problem) is that the
          learning rate must be smaller than <em>2 divided by the largest
          eigenvalue of the Hessian</em>. In practice: start small, watch the
          loss curve, and double α until things start to wobble.
        </p>

        <h2>The Goldilocks zone</h2>
        <div style={zonesGrid}>
          <ZoneCard
            color="var(--c-fundamentals)"
            icon="🐢"
            title="Too small"
            points={[
              "Converges, but slowly — many wasted steps",
              "May stop improving before reaching the true minimum",
              "Computationally expensive on large datasets",
            ]}
          />
          <ZoneCard
            color="var(--good)"
            icon="✓"
            title="Just right"
            points={[
              "Reaches the minimum in a reasonable number of steps",
              "Loss curve drops quickly then plateaus smoothly",
              "The starting point for any hyperparameter search",
            ]}
          />
          <ZoneCard
            color="var(--bad)"
            icon="💥"
            title="Too large"
            points={[
              "Overshoots on every step — loss oscillates or explodes",
              "Produces NaN weights in code",
              "Model is completely unusable",
            ]}
          />
        </div>

        <h2>How practitioners choose α</h2>
        <p>
          There's no formula that hands you the perfect learning rate. Here's
          what practitioners actually do:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>
            <strong style={{ color: "var(--ink)" }}>Grid search on a log scale.</strong>{" "}
            Try α = 0.1, 0.01, 0.001 and pick the best. The log scale matters —
            the gap between 0.001 and 0.01 is just as interesting as 0.1 to 1.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Learning rate finders.</strong>{" "}
            Train for a few steps at many α values, plot loss vs α, and pick the
            steepest downward slope. Popular in deep learning toolkits.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Schedules and warmup.</strong>{" "}
            Start with a large α to move quickly, then shrink it as training
            progresses. Cosine annealing and step decay are two common patterns.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Adaptive optimisers.</strong>{" "}
            Adam, RMSProp, and friends adjust the effective learning rate
            per-parameter automatically. They're popular precisely because
            choosing α by hand is hard.
          </li>
        </ul>

        <h2>Feature scaling changes everything</h2>
        <p>
          The "right" α depends on the scale of your features. If one feature
          ranges from 0–1 and another from 0–1,000,000, the loss surface is
          stretched into a long thin canyon. Gradient descent bounces off the
          steep walls and barely moves along the canyon floor. That's why
          standardising features before training is almost always worth doing —
          it makes the surface more bowl-like and a single α works better.
        </p>

        <div style={callout}>
          <div
            className="font-display"
            style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}
          >
            Rule of thumb
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Start at α = 0.01 with standardised features. If the loss isn't
            falling after a few hundred steps, try 0.1. If the loss explodes,
            try 0.001. Use a loss curve — not just the final number — to judge
            what's happening.
          </p>
        </div>

        <h2>Sweep it yourself</h2>
        <p>
          Run the same descent at four learning rates and watch the final loss:
          too small barely moves, too big diverges, and there&rsquo;s a sweet spot
          in between.
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
          <Link href="/learn/linear-regression/the-update-rule" style={navLink}>
            ← The update rule
          </Link>
          <Link href="/learn/linear-regression/descent-on-the-surface" style={navLink}>
            Next up · Descent on the surface →
          </Link>
        </div>
      </div>
    </article>
  );
}

function ZoneCard({
  color,
  icon,
  title,
  points,
}: {
  color: string;
  icon: string;
  title: string;
  points: string[];
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span
          className="font-display"
          style={{ fontSize: 14, fontWeight: 600, color }}
        >
          {title}
        </span>
      </div>
      <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.65 }}>
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
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

const zonesGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
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
