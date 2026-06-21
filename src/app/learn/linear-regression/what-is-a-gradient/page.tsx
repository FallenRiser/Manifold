import Link from "next/link";
import { GradientTangentLab } from "@/components/labs/GradientTangentLab";

export const metadata = {
  title: "What is a gradient? — Manifold",
  description: "The gradient is just the slope of the surface — which way is uphill, and how steep. Here's the intuition, in one dimension and then two.",
};

export default function WhatIsAGradientPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Core idea</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        What is a gradient?
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Last page we said the ball &ldquo;rolls downhill&rdquo; following the gradient. But what{" "}
        <em>is</em> a gradient, really? It&rsquo;s a simpler idea than the name suggests: it&rsquo;s
        just a slope.
      </p>

      <div className="lesson">
        <p>
          Forget surfaces for a second and think about a single hill — a curve. At any point on
          it, the <strong>slope</strong> tells you two things at once: <em>which way</em> is uphill,
          and <em>how steep</em> it is. A big number means a steep climb; a small number means
          nearly flat; zero means perfectly level — the very bottom (or top). That slope, at a
          point, is what mathematicians call the <strong>derivative</strong>.
        </p>
        <p>
          Drag the ball along the curve below and watch the straight <em>tangent</em> line tilt with
          it. The number is the slope right under the ball — steep on the sides, flat in the middle.
        </p>

        <GradientTangentLab />

        <h2>The sign tells you which way to step</h2>
        <p>
          Here&rsquo;s the part that makes gradient descent click. The <em>sign</em> of the slope
          points uphill. If the slope is positive, the curve climbs to the right, so the bottom must
          be to the <em>left</em> — and vice-versa. That&rsquo;s why the update rule{" "}
          <em>subtracts</em> the gradient: we always step in the direction opposite to &ldquo;up.&rdquo;
          Hit <strong>step downhill</strong> a few times and watch the ball walk itself to the
          bottom, exactly as the line did on the loss surface.
        </p>
        <p>
          Notice something else: the steps are <em>big</em> when the slope is steep and{" "}
          <em>small</em> as it flattens out near the bottom. The gradient is doing double duty — it
          sets the direction <em>and</em> naturally eases off as you arrive. That&rsquo;s why
          gradient descent slows down gracefully as it converges, rather than skidding past the
          target.
        </p>

        <h2>From one slope to a gradient</h2>
        <p>
          A real model has more than one knob. Linear regression has two — slope and intercept — so
          its loss isn&rsquo;t a curve but a surface (the bowl). At any point on that bowl you can
          ask &ldquo;how steep is it if I only change the slope?&rdquo; and &ldquo;how steep if I
          only change the intercept?&rdquo; Each answer is a <strong>partial derivative</strong>.
        </p>
        <p>
          Bundle those two slopes into a little arrow and you have the <strong>gradient</strong>: a
          vector that points in the steepest-uphill direction on the surface. Flip it around
          (&minus;gradient) and you have the steepest way <em>down</em> — the exact direction the
          ball rolled on the last page. With a hundred knobs you&rsquo;d have a hundred partial
          derivatives in that arrow; the idea doesn&rsquo;t change at all.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            The one-line definition
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            The <strong>gradient</strong> is the vector of partial derivatives — one slope per
            parameter. It points uphill, its length is the steepness, and gradient descent simply
            walks the other way. Everything else in training is detail on top of this.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/roll-downhill" style={navLink}>← Roll downhill</Link>
          <Link href="/learn/linear-regression/the-update-rule" style={navLink}>Next up · The update rule →</Link>
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
