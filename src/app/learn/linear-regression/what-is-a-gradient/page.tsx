import { GradientTangentLab } from "@/components/labs/GradientTangentLab";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 30)
y = 3 + 2*x + rng.normal(scale=1.0, size=30)
X = np.column_stack([np.ones_like(x), x])

def mse(t):
    return np.mean((X @ t - y)**2)

t = np.array([1.0, 1.0])

# analytical gradient of the MSE
g_analytic = (2/len(y)) * X.T @ (X @ t - y)

# numerical gradient: nudge each parameter and measure the slope
eps = 1e-5
g_numeric = np.zeros(2)
for i in range(2):
    d = np.zeros(2); d[i] = eps
    g_numeric[i] = (mse(t + d) - mse(t - d)) / (2*eps)

print("analytic gradient:", g_analytic.round(4))
print("numeric  gradient:", g_numeric.round(4))   # they match`;

const codeLib = `import numpy as np
from scipy.optimize import approx_fprime

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 30)
y = 3 + 2*x + rng.normal(scale=1.0, size=30)
X = np.column_stack([np.ones_like(x), x])

def mse(t):
    return np.mean((X @ t - y)**2)

t = np.array([1.0, 1.0])
g = approx_fprime(t, mse, 1e-6)     # SciPy estimates the gradient for you
print("scipy gradient:", g.round(4))`;

export const metadata = {
  title: "What is a gradient? — Manifold",
  description: "The gradient is just the slope of the surface — which way is uphill, and how steep. Here's the intuition, in one dimension and then two.",
};

export default function WhatIsAGradientPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>What is a gradient?</>}
        intro={<>
          Last page we said the ball &ldquo;rolls downhill&rdquo; following the gradient. But what{" "}
        <em>is</em> a gradient, really? It&rsquo;s a simpler idea than the name suggests: it&rsquo;s
        just a slope.
        </>}
      />

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

        <Callout color="var(--c-fundamentals)" title={<>The one-line definition</>}>
          The <strong>gradient</strong> is the vector of partial derivatives — one slope per
            parameter. It points uphill, its length is the steepness, and gradient descent simply
            walks the other way. Everything else in training is detail on top of this.
        </Callout>

        <h2>Compute it yourself</h2>
        <p>
          The analytical gradient and a finite-difference estimate agree to several
          decimals — proof the formula is just the slope in each direction. SciPy
          can estimate it numerically with one call.
        </p>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/linear-regression/roll-downhill", label: <>← Roll downhill</> }} next={{ href: "/learn/linear-regression/the-update-rule", label: <>Next up · The update rule →</> }} />
      </div>
    </article>
  );
}






