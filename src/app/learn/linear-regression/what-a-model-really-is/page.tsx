import Link from "next/link";
import { ModelSliderLab } from "@/components/labs/ModelSliderLab";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "What a model really is — Manifold",
  description: "A model is just a function — a rule that maps inputs to outputs. The 'machine learning' part is choosing that rule automatically.",
};

export default function WhatIsAModelPage() {
  const fromScratch = `import numpy as np

# A linear model is just a function with two parameters
slope, intercept = 95.3, 112.0   # learned values

def predict(x):
    return slope * x + intercept

# Evaluate on a single new house
size = 3.2          # sq ft (thousands)
print(f"Predicted price: \${predict(size):.0f}k")

# Compute training MSE
X = np.array([1.4, 1.7, 2.0, 2.3, 2.5, 2.8, 3.1, 3.4, 3.7, 4.0, 4.2, 4.5])
y = np.array([245, 312, 279, 308, 401, 390, 437, 421, 490, 518, 572, 601])
y_hat = predict(X)
mse   = np.mean((y - y_hat) ** 2)
print(f"Training MSE: {mse:.1f}")`;

  const withLibrary = `import numpy as np
from sklearn.linear_model import LinearRegression

X = np.array([1.4,1.7,2.0,2.3,2.5,2.8,3.1,3.4,3.7,4.0,4.2,4.5]).reshape(-1, 1)
y = np.array([245,312,279,308,401,390,437,421,490,518,572,601])

# fit() finds the best slope and intercept automatically
model = LinearRegression().fit(X, y)

# model.coef_ and model.intercept_ are the learned parameters
print(f"slope:     {model.coef_[0]:.2f}")
print(f"intercept: {model.intercept_:.2f}")

# predict() is the model function
print(f"Prediction for 3.2k sqft: \${model.predict([[3.2]])[0]:.0f}k")`;

  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Beginner</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        What a model really is
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        A model is just a function — a rule that turns inputs into a number. The &ldquo;machine
        learning&rdquo; part is choosing the right rule automatically.
      </p>

      <div className="lesson">
        <p>
          Strip away all the terminology and a machine learning model is surprisingly ordinary: it&rsquo;s
          just a <strong>function</strong>. You put a number in, you get a number out. That&rsquo;s it.
          The interesting part is how we choose which function — but let&rsquo;s start with the
          simplest one imaginable.
        </p>

        <h2>The simplest model: a straight line</h2>
        <p>
          A straight line is described by two numbers: its <strong>slope</strong> (how steep it is)
          and its <strong>intercept</strong> (where it crosses the vertical axis). Put them together
          and you have:
        </p>
        <div style={{ textAlign: "center", margin: "1rem 0", padding: "14px 20px", background: "var(--surface-2)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <code style={{ fontSize: 20, color: "var(--ink)", letterSpacing: "0.02em" }}>ŷ = m · x + b</code>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 28 }}>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}><strong style={{ color: "var(--ink)" }}>ŷ</strong> — predicted value</span>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}><strong style={{ color: "var(--ink)" }}>m</strong> — slope</span>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}><strong style={{ color: "var(--ink)" }}>b</strong> — intercept</span>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}><strong style={{ color: "var(--ink)" }}>x</strong> — input</span>
          </div>
        </div>
        <p>
          Pick any <code>m</code> and <code>b</code>, and you have a model. Pick <em>good</em>{" "}
          ones, and you have a good model. The job of training is to find those good numbers.
          These are called the model&rsquo;s <strong>parameters</strong>.
        </p>

        <h2>Try it yourself</h2>
        <p>
          Below is a dataset of twelve points (size → price, same data we&rsquo;ll use throughout
          this track). Adjust the slope and intercept with the sliders and watch how the line
          changes — and how the MSE (the average squared error) responds. The dashed green line is
          the mathematical best fit; try to match it.
        </p>

        <ModelSliderLab />

        <p>
          A few things to notice as you play:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.9, color: "var(--muted)", fontSize: 15 }}>
          <li>The <strong>prediction</strong> at x = 6.5 changes smoothly as you drag — the model
            is just evaluating the formula <code>m × 6.5 + b</code>.</li>
          <li>The <strong>MSE</strong> hits its lowest point when your line matches the dashed one.
            Any deviation — tilt it, raise it, lower it — and the error grows.</li>
          <li>There is exactly <strong>one pair of (m, b)</strong> that minimises the error. Not
            a range, not a judgment call — one answer. That&rsquo;s what makes this tractable for a computer.</li>
        </ul>

        <h2>Parameters vs hyperparameters</h2>
        <p>
          The slope and intercept are <strong>parameters</strong> — numbers the model learns
          automatically from data during training. Most models have many more: a neural network
          can have billions of parameters, all learned the same way.
        </p>
        <p>
          Later you&rsquo;ll meet <strong>hyperparameters</strong> — numbers <em>you</em> choose
          before training, like how fast the algorithm learns or how complex the model is allowed
          to get. The distinction matters: parameters are found by the algorithm; hyperparameters
          are set by you.
        </p>

        <h2>The same idea at any scale</h2>
        <p>
          A linear regression model has two parameters. A neural network has millions. But the
          structure is identical: a function with parameters, a way to measure how wrong it is,
          and a method to adjust the parameters to reduce the wrongness. Every page of this track
          is building that picture up from scratch.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            The one thing to take away
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            A model is a function with parameters. Training is the process of finding the parameter
            values that make the function&rsquo;s output match the data as closely as possible.
            The &ldquo;learning&rdquo; in machine learning is just finding those numbers.
          </p>
        </div>

        <h2>The code</h2>
        <p>
          A model really is just a function. Here&rsquo;s that idea in Python —
          written explicitly first, then handed off to scikit-learn.
        </p>

        <CodeBlock fromScratch={fromScratch} withLibrary={withLibrary} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/why-predict-at-all" style={navLink}>← Why predict at all?</Link>
          <Link href="/learn/linear-regression" style={navLink}>Next up · The line of best fit →</Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center",
    background: `color-mix(in srgb, ${color} 13%, var(--surface))`,
    color, fontSize: 12, padding: "3px 10px", borderRadius: 999,
  };
}

const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };

const callout: React.CSSProperties = {
  background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))",
  border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))",
  borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0",
};
