import Link from "next/link";
import { DescentSurface3D } from "@/components/labs/DescentSurface3D";

export const metadata = {
  title: "Descent on the surface — Manifold",
  description:
    "Watch gradient descent trace a path on the actual loss bowl — from any starting point, at any learning rate. The path always spirals to the minimum.",
};

export default function DescentOnTheSurfacePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Core idea</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1
        className="font-serif"
        style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}
      >
        Descent on the surface
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        You understand the update rule and the learning rate. Now watch them
        together — gradient descent tracing its path across the actual
        three-dimensional loss bowl, toward the minimum at the bottom.
      </p>

      <div className="lesson">
        <p>
          Each point on the surface below is one possible line — defined by a
          slope m and an intercept b. The height of the surface at that point is
          the mean squared error that line produces on our dataset. The cup shape
          means there's exactly one lowest point: the best line, the one that
          minimises the loss.
        </p>
        <p>
          The orange dot is the current parameter position. Hit{" "}
          <strong>Run</strong> and watch it trace a path toward the green
          minimum. Try different starting points and learning rates to build
          intuition for how the shape of the journey changes.
        </p>

        <DescentSurface3D />

        <h2>What the path reveals</h2>
        <p>
          A few observations that become obvious once you watch the animation:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>
            <strong style={{ color: "var(--ink)" }}>The path isn't straight.</strong>{" "}
            The surface isn't equally steep in m and b. Descent moves fast along
            the steeper direction and slowly along the shallower one, creating
            the characteristic spiral or zig-zag.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Starting point barely matters here.</strong>{" "}
            For a convex bowl, all paths lead to the same minimum. This is why
            linear regression always finds the unique best line. Non-convex
            surfaces (neural networks) are a different story.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>High α = larger steps and more bounce.</strong>{" "}
            Turn the learning rate up and the path gets jagged — each step
            overshoots the valley floor a little. Just high enough and it
            diverges entirely.
          </li>
        </ul>

        <h2>The convexity guarantee</h2>
        <p>
          The loss surface for linear regression is always a perfect bowl — a
          quadratic in the parameters. Mathematically, that means it's{" "}
          <strong>convex</strong>: any line you draw between two points on the
          surface lies above it. Convex functions have exactly one global
          minimum, and gradient descent is guaranteed to find it (given a small
          enough learning rate).
        </p>
        <p>
          That guarantee evaporates the moment you add nonlinearities — a hidden
          layer, a tree split, anything that creates multiple valleys. For now,
          enjoy the comfort of a surface that always has a single bottom.
        </p>

        <h2>What gradient descent doesn't see</h2>
        <p>
          The algorithm at each step only knows the slope at its current
          location — it has no memory of where it's been and no view of the full
          surface. It's running blind, guided only by the local gradient. This is
          both the beauty (it scales to surfaces with millions of dimensions) and
          the danger (it can stall in a flat region or oscillate near a narrow
          valley).
        </p>

        <div style={callout}>
          <div
            className="font-display"
            style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}
          >
            Putting it all together
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            You now have the full picture of gradient descent on a linear model:
            the loss surface is a bowl; the gradient is the slope at your current
            position; the update rule steps opposite to the gradient by α; and
            the process repeats until the surface flattens — or you tell it to
            stop. Everything from here — SGD, Adam, neural networks — is a
            variation on this core loop.
          </p>
        </div>

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
          <Link href="/learn/linear-regression/learning-rate" style={navLink}>
            ← Learning rate
          </Link>
          <Link href="/learn/linear-regression/batch-vs-sgd" style={navLink}>
            Next up · Batch, stochastic, mini-batch →
          </Link>
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
