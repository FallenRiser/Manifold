import Link from "next/link";
import { CostFunctionLab } from "@/components/labs/CostFunctionLab";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The cost function — Manifold",
  description: "Twelve residuals are twelve opinions. To choose between two lines, we need them to agree on one number. That's the cost function.",
};

export default function CostFunctionPage() {
  const fromScratch = `import numpy as np

X = np.array([1.4, 1.7, 2.0, 2.3, 2.5, 2.8, 3.1, 3.4, 3.7, 4.0, 4.2, 4.5])
y = np.array([245, 312, 279, 308, 401, 390, 437, 421, 490, 518, 572, 601])

def predict(slope, intercept, X):
    return slope * X + intercept

def mse(slope, intercept, X, y):
    residuals = y - predict(slope, intercept, X)   # each point's error
    return np.mean(residuals ** 2)                  # average squared error

# Compare three candidate lines
print(f"slope=90, intercept=120  → MSE = {mse(90, 120, X, y):.1f}")
print(f"slope=95, intercept=112  → MSE = {mse(95, 112, X, y):.1f}")
print(f"slope=50, intercept=200  → MSE = {mse(50, 200, X, y):.1f}")

# MAE for comparison (no squaring)
def mae(slope, intercept, X, y):
    return np.mean(np.abs(y - predict(slope, intercept, X)))

print(f"Best line MAE: {mae(95, 112, X, y):.1f}")`;

  const withLibrary = `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, root_mean_squared_error

X = np.array([1.4,1.7,2.0,2.3,2.5,2.8,3.1,3.4,3.7,4.0,4.2,4.5]).reshape(-1, 1)
y = np.array([245,312,279,308,401,390,437,421,490,518,572,601])

model = LinearRegression().fit(X, y)
y_hat = model.predict(X)

# sklearn minimises MSE automatically
print(f"MSE:  {mean_squared_error(y, y_hat):.1f}")
print(f"RMSE: {root_mean_squared_error(y, y_hat):.1f}")
print(f"MAE:  {mean_absolute_error(y, y_hat):.1f}")`;

  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Beginner</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The cost function
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Twelve residuals are twelve opinions. To compare two lines, we need them all to agree on
        one number. That number is the <em>cost</em>.
      </p>

      <div className="lesson">
        <p>
          Last page, we met the residual — the gap between each prediction and the truth. With
          twelve training examples, we have twelve residuals. A computer can&rsquo;t optimise
          twelve numbers at once; it needs a single target to drive toward. The{" "}
          <strong>cost function</strong> (also called the <strong>loss function</strong>) is how
          we collapse those twelve numbers into one.
        </p>

        <h2>Why not just add them up?</h2>
        <p>
          The obvious move: sum all the residuals. But we saw that they cancel — a positive and a
          negative can offset each other perfectly, making a wildly wrong line look flawless. A
          line that predicts +10 for the first half of the data and −10 for the second half gets a
          total error of zero. That can&rsquo;t be right.
        </p>
        <p>
          We need a way to make all errors <em>positive</em>. Two obvious candidates:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "1rem 0" }}>
          <div style={optionCard}>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Absolute value</div>
            <code style={{ fontSize: 15 }}>|eᵢ|</code>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>Always positive. Off by 2 is twice as bad as off by 1. Has a sharp kink at zero.</p>
          </div>
          <div style={{ ...optionCard, borderColor: "color-mix(in srgb, var(--c-fundamentals) 28%, var(--border))", background: "color-mix(in srgb, var(--c-fundamentals) 6%, var(--surface-2))" }}>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: "var(--c-fundamentals)", marginBottom: 4 }}>Square it ← we use this</div>
            <code style={{ fontSize: 15 }}>eᵢ²</code>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>Always positive. Off by 2 is <em>four</em> times as bad. Smooth everywhere.</p>
          </div>
        </div>
        <p>
          Squaring wins for reasons we&rsquo;ll explore fully on the next page. The main ones:
          it&rsquo;s mathematically smooth (which gradient descent loves), and it punishes large
          mistakes more than small ones.
        </p>

        <h2>Build the MSE</h2>
        <p>
          Step through the visualisation below. First, see the raw errors — watch how they nearly
          cancel. Then square them — suddenly all bars are positive, and the big misses stand out.
          Finally, average the squares to get a single number: the <strong>Mean Squared Error</strong>.
        </p>

        <CostFunctionLab />

        <p>
          That final number — the MSE — is what we&rsquo;ll minimise. Every training algorithm
          in this track is just a different method for finding the slope and intercept that push
          the MSE as low as it can go.
        </p>

        <h2>Cost vs loss: same idea, different scale</h2>
        <p>
          You&rsquo;ll hear both <strong>loss</strong> and <strong>cost</strong> in the wild, and
          people use them interchangeably. The subtle distinction: the <em>loss</em> is sometimes
          the error on a single example (eᵢ²), while the <em>cost</em> is the average over all
          examples. In practice, both words almost always mean the total average, including in this
          track. Don&rsquo;t let the vocabulary trip you up.
        </p>

        <h2>Why average instead of sum?</h2>
        <p>
          Dividing by N is optional mathematically — the minimum is at the same place either way.
          But averaging has practical benefits: the MSE stays in the same ballpark regardless of
          dataset size, which makes hyperparameters like the learning rate transferable between
          experiments. Always prefer the average.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            The formula to know
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            <code>MSE = (1/N) Σ (yᵢ − ŷᵢ)²</code> — average squared difference between actual
            and predicted values. It&rsquo;s always non-negative, is zero only for a perfect fit,
            and grows fast as errors grow large. This is the number we will minimise for the rest
            of this track.
          </p>
        </div>

        <h2>The code</h2>
        <p>
          Computing MSE by hand makes the formula concrete. Notice that
          squaring flips all negatives positive — then we just average.
        </p>

        <CodeBlock fromScratch={fromScratch} withLibrary={withLibrary} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/what-is-error" style={navLink}>← What is error?</Link>
          <Link href="/learn/linear-regression/why-squared-error" style={navLink}>Next up · Why squared error? →</Link>
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

const optionCard: React.CSSProperties = {
  background: "var(--surface-2)", border: "1px solid var(--border)",
  borderRadius: 12, padding: "12px 14px",
};
