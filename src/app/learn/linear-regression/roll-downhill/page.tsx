import Link from "next/link";
import { GradientDescentLab } from "@/components/labs/GradientDescentLab";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader } from "@/components/lesson";

export const metadata = {
  title: "Roll downhill — Manifold",
  description:
    "Gradient descent is just rolling downhill on the loss surface. Watch the ball find the best line by following the slope, step by step.",
};

export default function RollDownhillPage() {
  const fromScratch = `import numpy as np

X = np.array([1.4, 1.7, 2.0, 2.3, 2.5, 2.8, 3.1, 3.4, 3.7, 4.0, 4.2, 4.5])
y = np.array([245, 312, 279, 308, 401, 390, 437, 421, 490, 518, 572, 601])

# Start at a random guess
slope, intercept = 0.0, 0.0
lr = 0.01   # learning rate
n  = len(X)

for step in range(1000):
    y_hat      = slope * X + intercept
    residuals  = y_hat - y                        # error for each point

    # Gradient of MSE w.r.t. each parameter
    grad_slope     = (2 / n) * np.dot(residuals, X)
    grad_intercept = (2 / n) * residuals.sum()

    # Step opposite to gradient
    slope     -= lr * grad_slope
    intercept -= lr * grad_intercept

    if step % 200 == 0:
        mse = np.mean(residuals ** 2)
        print(f"step {step:4d} | MSE={mse:7.1f} | "
              f"slope={slope:.2f} | intercept={intercept:.2f}")

print(f"\nFinal: slope={slope:.2f}, intercept={intercept:.2f}")`;

  const withLibrary = `import numpy as np
from sklearn.linear_model import SGDRegressor
from sklearn.preprocessing import StandardScaler

X_raw = np.array([1.4,1.7,2.0,2.3,2.5,2.8,3.1,3.4,3.7,4.0,4.2,4.5]).reshape(-1, 1)
y     = np.array([245,312,279,308,401,390,437,421,490,518,572,601])

# SGD is sensitive to scale — standardise features first
scaler = StandardScaler()
X = scaler.fit_transform(X_raw)

model = SGDRegressor(
    learning_rate="constant",
    eta0=0.01,
    max_iter=1000,
    random_state=42,
)
model.fit(X, y)

print(f"slope (scaled space): {model.coef_[0]:.2f}")
print(f"intercept:            {model.intercept_[0]:.2f}")
# Use LinearRegression() for the closed-form exact answer`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Roll downhill</>}
        intro={<>
          You know the loss surface is a bowl and that the best line is at the
        bottom. Now watch a computer find it — by literally rolling downhill, one
        small step at a time.
        </>}
      />

      <div className="lesson">
        <p>
          Picture a marble placed somewhere on the inside of a bowl. Let go and
          it rolls toward the lowest point on its own. Gradient descent is that
          marble — except the bowl is the loss surface, and every "roll" is one
          update to the parameters of your model.
        </p>
        <p>
          The computer doesn't see the whole bowl at once. It only checks the
          slope <em>right where it is standing</em>. "Is it steeper to the left
          or right? How steep?" That local slope is the gradient — and stepping
          against it is the whole algorithm.
        </p>

        <h2>See it happen</h2>
        <p>
          The left panel shows the loss surface from above as a heatmap — darker
          means lower loss, and the green circle is the true minimum. The right
          panel shows what that means in terms of the actual fitted line.
        </p>
        <p>
          Hit <strong>Step</strong> once to take a single update. Hit{" "}
          <strong>Run</strong> to let it animate. Watch the path spiral toward
          the bottom.
        </p>

        <GradientDescentLab />

        <h2>What you should notice</h2>
        <p>
          A few things happen as the descent runs that are worth pausing on:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>
            <strong style={{ color: "var(--ink)" }}>Steps shrink naturally.</strong>{" "}
            Near the start the path moves in big jumps; near the bottom it takes
            tiny shuffles. That's because the gradient — the slope — gets
            shallower near the minimum, so the steps automatically shrink without
            any extra logic.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>The path curves.</strong>{" "}
            The surface isn't equally steep in every direction, so the ball
            doesn't fall straight toward the bottom. It oscillates and spirals a
            little — perfectly normal.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Learning rate matters.</strong>{" "}
            Push the slider up and the steps get bigger — faster at first, but
            risky. Too high and the ball flies past the minimum and{" "}
            <em>diverges</em> — the failure we unpack when we reach the learning rate.
          </li>
        </ul>

        <h2>Why not just solve it directly?</h2>
        <p>
          Linear regression <em>does</em> have a direct formula — the normal
          equation. But neural networks, decision trees, and most real models
          don't. Gradient descent is the one algorithm that works everywhere, as
          long as the loss has a gradient to follow. Learning it here, in the
          simplest possible setting, gives you the key to almost every training
          loop you'll ever read.
        </p>

        <div style={callout}>
          <div
            className="font-display"
            style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}
          >
            The one sentence
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Gradient descent finds the minimum of a function by repeatedly moving
            a small step in the direction of steepest descent — opposite to the
            gradient. Every training loop you will ever write is this idea, scaled
            up.
          </p>
        </div>

        <h2>The code</h2>
        <p>
          The gradient descent loop in full. Every training loop you&rsquo;ll
          ever write is this idea — the only things that change are the model
          and the gradient formula.
        </p>

        <CodeBlock setup={REGRESSION_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

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
          <Link href="/learn/linear-regression/what-best-means" style={navLink}>
            ← What best means
          </Link>
          <Link href="/learn/linear-regression/what-is-a-gradient" style={navLink}>
            Next up · What is a gradient? →
          </Link>
        </div>
      </div>
    </article>
  );
}



const navLink: React.CSSProperties = {
  fontSize: 14,
  color: "var(--brand)",
  textDecoration: "none",
};

const callout: React.CSSProperties = {
  background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))",
  border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))",
  borderRadius: 12,
  padding: "13px 15px",
  margin: "1.8rem 0 0",
};
