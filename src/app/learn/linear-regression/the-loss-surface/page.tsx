import Link from "next/link";
import { LossSurface3D } from "@/components/labs/LossSurface3D";
import { GradientDescentLab } from "@/components/labs/GradientDescentLab";

export const metadata = {
  title: "The loss surface — Manifold",
  description: "See every possible line as a point on a landscape of error, and watch gradient descent roll downhill to the best one.",
};

export default function LossSurfacePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Core idea</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 10 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The loss surface
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        This is the big one — the idea that powers almost every model you&rsquo;ll ever train.
        Once you see it, gradient descent stops being a mystery and starts being obvious.
      </p>

      <div className="lesson">
        <p>
          So far we&rsquo;ve been nudging a line by hand and reading off its error. But a computer
          can&rsquo;t eyeball the chart. To let it <em>search</em> for the best line, we need to
          change how we picture the problem — from &ldquo;a line on the data&rdquo; to{" "}
          &ldquo;a point on a landscape.&rdquo;
        </p>

        <h2>Every line is a point on a surface</h2>
        <p>
          A line is just two numbers: a slope and an intercept. So picture a map where{" "}
          <em>across</em> is the slope and <em>back</em> is the intercept. Every spot on that map
          is one possible line. Now lift each spot to a <em>height</em> equal to that line&rsquo;s
          error (its MSE). Low spots are good lines; high spots are bad ones. Together they form a
          smooth <strong>bowl</strong> — and the lowest point of the bowl is the best line there is.
        </p>

        <LossSurface3D />

        <p>
          Because we used squared error, this bowl is always a single, smooth valley with one
          bottom (no confusing dips to get stuck in). That&rsquo;s the quiet payoff of the choice we
          made last page — and it&rsquo;s exactly what makes the next idea work.
        </p>

        <h2>Gradient descent: just walk downhill</h2>
        <p>
          Here&rsquo;s the trick. Drop a ball anywhere on the bowl. Which way does it roll? Downhill,
          in the steepest direction. The <strong>gradient</strong> is simply the arrow pointing
          straight <em>uphill</em>, so to go down we step the opposite way. Take a small step,
          check the slope again, step again — and you spiral down to the bottom. That&rsquo;s the
          whole algorithm:
        </p>
        <p>
          <code>new value = old value − (learning rate) × (gradient)</code>
        </p>
        <p>
          Below, the left panel is the bowl seen <em>from above</em> — bright is the valley, deep
          violet is high error. Hit <strong>Run</strong> and watch the ball find its way down. The
          right panel shows the same thing as a line on the data: as the ball descends, the line
          quietly snaps into the perfect fit. They&rsquo;re two views of the <em>same</em> moment.
        </p>

        <GradientDescentLab />

        <h2>The learning rate is everything</h2>
        <p>
          That <strong>learning rate</strong> — how big a step you take — is the single most
          important dial in machine learning. Drag it and re-run:
        </p>
        <p>
          <strong>Too small</strong>, and the ball inches down forever — correct, but painfully
          slow. <strong>Just right</strong>, and it glides smoothly to the bottom in a few steps.
          <strong> Too large</strong>, and it overshoots the valley, bounces to the far wall, and
          flings itself <em>up</em> and out — the error explodes instead of shrinking. Push the
          slider past about <code>1.0</code> and watch it diverge.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            Why this matters everywhere
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            This exact loop — compute the gradient, step downhill, repeat — is how neural networks,
            logistic regression, and most of modern ML are trained. The surfaces get vastly more
            complicated (millions of dimensions, bumpy valleys), but the move never changes. Master
            it here on a simple bowl and you&rsquo;ve met the engine under all of it.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/why-squared-error" style={navLink}>← Why squared error?</Link>
          <Link href="/learn/linear-regression/what-is-a-gradient" style={navLink}>Next up · What is a gradient? →</Link>
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
