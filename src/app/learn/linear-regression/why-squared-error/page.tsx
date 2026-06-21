import Link from "next/link";
import { PenaltyCurves } from "@/components/labs/PenaltyCurves";
import { OutlierLab } from "@/components/labs/OutlierLab";

export const metadata = {
  title: "Why squared error? — Manifold",
  description: "Why linear regression squares its errors instead of just taking the absolute value — and the trade-off that choice quietly makes.",
};

export default function WhySquaredErrorPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Beginner</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 9 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Why squared error?
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        We&rsquo;ve been squaring our mistakes without really asking why. It turns out that one
        small choice quietly shapes how your model behaves — for better <em>and</em> for worse.
      </p>

      <div className="lesson">
        <p>
          Last time, we measured how wrong a line was by squaring each gap and averaging — the
          mean squared error. But squaring is a <em>choice</em>. We could just as easily take the
          plain distance, ignoring the sign — the <strong>absolute error</strong>. So why does
          almost everyone reach for squares? Three good reasons, and one real cost.
        </p>

        <h2>Reason 1 — it makes the sign disappear</h2>
        <p>
          A residual can be positive (we guessed too low) or negative (too high). If we just added
          them up, a line that&rsquo;s wildly wrong in both directions could look perfect as the
          errors cancel out. Squaring fixes that instantly: a square is never negative, so mistakes
          can only ever <em>add up</em>. (Absolute value does this too — hold that thought.)
        </p>

        <h2>Reason 2 — big mistakes hurt more</h2>
        <p>
          Here&rsquo;s the interesting one. With absolute error, being off by 2 is exactly twice as
          bad as being off by 1. But with squared error, being off by 2 is <em>four</em> times as
          bad. Slide the error size below and watch the two penalties pull apart.
        </p>

        <PenaltyCurves />

        <p>
          Past an error of 1, the squared penalty rockets away from the absolute one. That means a
          squared-error line will go out of its way to avoid any single large miss — it would
          rather be a little wrong on many points than very wrong on one. Often that&rsquo;s exactly
          the behaviour you want.
        </p>

        <h2>Reason 3 — it has one clean answer</h2>
        <p>
          Squared error is smooth — a gentle bowl with a single lowest point (you saw that bowl as
          the loss surface). That smoothness means there&rsquo;s a tidy formula for the best line,
          <em>and</em> it&rsquo;s easy for an algorithm to roll downhill to the bottom. Absolute
          error has a sharp kink at zero that makes both of those harder. This is the reason squared
          error pairs so naturally with <strong>gradient descent</strong>, coming up next.
        </p>

        <h2>The cost — squared error is fragile to outliers</h2>
        <p>
          That same eagerness to crush big errors is also squared error&rsquo;s weakness. Because
          one far-off point contributes such an enormous penalty, the line will <em>chase</em> it,
          twisting away from everything else just to reduce that one giant square. Drag the orange
          point below into an outlier and watch it happen.
        </p>

        <OutlierLab />

        <p>
          The squared-error line (solid) lurches toward the outlier; the absolute-error line
          (dashed) shrugs it off. That&rsquo;s the trade-off in one picture: <strong>squared error
          is precise but sensitive; absolute error is robust but blunt.</strong> An outlier is just
          a point far from the rest — sometimes a data-entry mistake, sometimes a genuine rare event.
        </p>

        <h2>So which should you use?</h2>
        <p>
          Reach for <strong>squared error (MSE)</strong> by default — it&rsquo;s smooth, has a clean
          solution, and big errors usually <em>should</em> be punished. Reach for{" "}
          <strong>absolute error (MAE)</strong> when your data has outliers you don&rsquo;t want
          dominating the fit — predicting house prices where a few mansions would otherwise warp
          everything, or any sensor data prone to occasional wild readings.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            In an interview
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            &ldquo;Why MSE over MAE?&rdquo; → <em>MSE is differentiable everywhere and convex, so it
            has a closed-form solution and plays nicely with gradient descent; it also penalises
            large errors more heavily. The catch is sensitivity to outliers — when that matters, MAE
            (or a robust loss like Huber, which blends the two) is the better choice.</em>
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/the-cost-function" style={navLink}>← The cost function</Link>
          <Link href="/learn/linear-regression/the-loss-surface" style={navLink}>Next up · The loss surface →</Link>
        </div>
      </div>
    </article>
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

const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };

const callout: React.CSSProperties = {
  background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))",
  border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))",
  borderRadius: 12,
  padding: "13px 15px",
  margin: "1.8rem 0 0",
};
