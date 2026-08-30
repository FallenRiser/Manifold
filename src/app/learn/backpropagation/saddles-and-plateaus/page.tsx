import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Saddles, plateaus & why noise helps — Manifold",
  description:
    "Local minima are the famous worry and almost never the real one. In high dimensions the stationary points you actually meet are saddles, and the difference decides what to do about them.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Minimum, maximum and saddle, drawn as contour sketches. Literal coordinates.
function CriticalPointsFigure() {
  const W = 540, H = 170;
  const panel = (ox: number, title: string, kind: "min" | "max" | "saddle") => {
    const cx = ox + 76, cy = 62;
    const rings = [1, 2, 3];
    return (
      <g key={title}>
        <rect x={ox} y={6} width={152} height={112} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />
        {kind !== "saddle"
          ? rings.map((r) => (
              <ellipse key={r} cx={cx} cy={cy} rx={r * 17} ry={r * 12} fill="none"
                stroke={kind === "min" ? CORAL : "var(--muted)"} strokeWidth={1.1} opacity={0.75} />
            ))
          : rings.map((r) => (
              <g key={r}>
                <path d={`M ${cx - 60} ${cy - r * 13} Q ${cx} ${cy - r * 3} ${cx + 60} ${cy - r * 13}`}
                  fill="none" stroke={CORAL} strokeWidth={1.1} opacity={0.75} />
                <path d={`M ${cx - 60} ${cy + r * 13} Q ${cx} ${cy + r * 3} ${cx + 60} ${cy + r * 13}`}
                  fill="none" stroke={CORAL} strokeWidth={1.1} opacity={0.75} />
              </g>
            ))}
        <circle cx={cx} cy={cy} r={3.4} fill="var(--ink)" />
        {kind === "saddle" && (
          <>
            <path d={`M ${cx - 34} ${cy} L ${cx + 34} ${cy}`} stroke="var(--good)" strokeWidth={1.4} strokeDasharray="3 2" />
            <path d={`M ${cx} ${cy - 26} L ${cx} ${cy + 26}`} stroke="var(--bad)" strokeWidth={1.4} strokeDasharray="3 2" />
          </>
        )}
        <text x={ox + 76} y={136} fontSize={11} fill="var(--ink)" textAnchor="middle">{title}</text>
        <text x={ox + 76} y={152} fontSize={9.5} fill="var(--faint)" textAnchor="middle">
          {kind === "min" ? "up in every direction" : kind === "max" ? "down in every direction" : "up some, down others"}
        </text>
      </g>
    );
  };
  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
        role="img" aria-label="Three contour sketches: a minimum, a maximum, and a saddle point with one ascending and one descending direction">
        {panel(0, "minimum", "min")}
        {panel(194, "maximum", "max")}
        {panel(388, "saddle", "saddle")}
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
        All three have zero gradient. Only one of them traps you — and it is the rarest in high dimensions.
      </figcaption>
    </figure>
  );
}

export default function SaddlesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Training dynamics", color: CORAL }, { label: "Tier 3 · theory", color: CORAL }]}
        time="about 8 minutes"
        title={<>Saddles, plateaus &amp; why noise helps</>}
        intro={<>The standard worry about non-convex optimisation is getting stuck in a bad local minimum. In the
          dimensions neural networks actually live in, that worry is close to misplaced — and what replaces it
          suggests a different response.</>}
      />

      <div className="lesson">
        <h2>Three ways for the gradient to be zero</h2>
        <CriticalPointsFigure />
        <p>
          A stationary point is anywhere the gradient vanishes, and there are three kinds. At a{" "}
          <strong>minimum</strong> the surface curves upward in every direction. At a <strong>maximum</strong>,
          downward in every direction. At a <strong>saddle</strong>, upward in some and downward in others — so
          there is an escape route, if you can find it.
        </p>

        <Callout color={CORAL} title={<>Why high dimension changes the odds so completely</>}>
          Being a local minimum requires the curvature to be positive in <em>every single</em> direction. In a model
          with a million parameters, that is a million conditions holding at once. Treat each as a coin flip and the
          probability is <M>{String.raw`2^{-1{,}000{,}000}`}</M> — the real situation is more structured than coin
          flips, but the conclusion survives: <strong>a random stationary point in high dimensions is
          overwhelmingly likely to be a saddle.</strong>
          <br /><br />
          Which reframes the problem entirely. You are not usually trapped. You are usually on a surface that is
          nearly flat in most directions and descending in a few, and the difficulty is <em>slowness</em> rather than
          <em> capture</em>.
        </Callout>

        <h2>Plateaus are the practical problem</h2>
        <p>
          Near a saddle the gradient is small in every direction, including the ones that go down. Gradient descent
          takes proportionally tiny steps and can spend thousands of iterations crossing a region it will
          eventually leave. On a loss curve this looks exactly like convergence — a long flat stretch — and it is
          not.
        </p>
        <p>
          Three things get you across, and each is something already met in this chapter:
        </p>
        <ul>
          <li><strong>Momentum.</strong> Accumulated velocity carries you through a flat region that the local
            gradient alone would barely move you in — the plateau case from the previous page.</li>
          <li><strong>Adaptive step sizes.</strong> Adam divides by the running gradient magnitude, so a
            consistently small gradient produces a step that is <em>not</em> correspondingly small. This is
            arguably its most valuable property.</li>
          <li><strong>Noise.</strong> A mini-batch gradient is a random perturbation of the true one. At an exact
            saddle the true gradient is zero and the batch gradient is not, so noise is what breaks the symmetry
            and pushes you off.</li>
        </ul>

        <p>
          That last one is worth stating plainly, because it inverts the natural reading:{" "}
          <strong>stochastic gradient descent is not a compromised version of gradient descent that we tolerate for
          speed.</strong> Full-batch descent would sit at an exact saddle indefinitely, because its gradient there
          is exactly zero. The noise is load-bearing.
        </p>

        <Proof color={CORAL} title="what the Hessian says, and why eigenvalues decide it">
          <p>
            Near a stationary point <M>{String.raw`\theta^*`}</M>, the second-order expansion of the loss is
          </p>
          <MathBlock>{String.raw`\mathcal{L}(\theta^* + \Delta) \;\approx\; \mathcal{L}(\theta^*) + \tfrac{1}{2}\Delta^\top H \Delta`}</MathBlock>
          <p>
            with <M>{String.raw`H`}</M> the Hessian of second derivatives; the first-order term is absent because
            the gradient vanishes. <M>{String.raw`H`}</M> is symmetric, so it has real eigenvalues and an
            orthogonal eigenbasis, and along the eigenvector <M>{String.raw`\mathbf{u}_i`}</M> the loss behaves like{" "}
            <M>{String.raw`\tfrac{1}{2}\lambda_i t^2`}</M>. The sign of each eigenvalue is the curvature in that
            direction:
          </p>
          <ul>
            <li>all <M>{String.raw`\lambda_i > 0`}</M> — a minimum</li>
            <li>all <M>{String.raw`\lambda_i < 0`}</M> — a maximum</li>
            <li>mixed signs — a saddle, and any eigenvector with{" "}
              <M>{String.raw`\lambda_i < 0`}</M> is an escape direction</li>
            <li>some <M>{String.raw`\lambda_i = 0`}</M> — degenerate; flat to second order, which is the plateau
              case and the slowest of all</li>
          </ul>
          <p>
            Now the counting argument in a form that survives scrutiny. For a minimum, all{" "}
            <M>{String.raw`d`}</M> eigenvalues must be positive. Empirically, the Hessian spectrum of a trained
            network has eigenvalues of both signs at most stationary points encountered during training, with the
            proportion of negative ones shrinking as the loss falls. Low-loss stationary points behave like minima;
            high-loss ones behave like saddles. That is a much more useful picture than &ldquo;the landscape is full
            of traps&rdquo;: <strong>bad stationary points tend to be escapable and good ones tend to be
            genuine.</strong>
          </p>
        </Proof>

        <h2>What this means when your loss goes flat</h2>
        <p>
          The practical translation, which connects to the field guide in the{" "}
          <Link href="/learn/perceptron-to-mlp/what-can-go-wrong" style={link}>previous track</Link>:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 600 }}>
            <thead>
              <tr>
                {["flat loss, because…", "how to tell", "what to do"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 20px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["a plateau or saddle", "gradient norm is small but non-zero", "wait, add momentum, or switch to Adam"],
                ["dead units", "gradient norm is exactly zero at a layer", "restart with a lower rate; change activation"],
                ["the learning rate is too small", "loss declines, just imperceptibly — zoom the axis", "raise it by 10×"],
                ["a genuine optimum", "train loss is low and validation agrees", "nothing — you are finished"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 20px 7px 0", color: j === 2 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top", lineHeight: 1.45 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          The middle column is one line of code — print the gradient norm, per layer, and watch it. The four causes
          look identical on a loss curve and are completely distinguishable the moment you look at the gradient
          instead. That is the habit this whole track is building toward, and the next chapter is what you see when
          you do it.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why are local minima less of a concern in high-dimensional networks than intuition suggests?</>,
              options: [
                "The loss surface is actually convex in high dimensions",
                "A minimum needs positive curvature in every one of millions of directions, so most stationary points are saddles instead",
                "Modern optimisers escape any local minimum",
              ],
              answer: 1,
              explain: <>It is a counting argument about the Hessian&rsquo;s eigenvalues: all must be positive for a
                minimum, and mixed signs are far more likely. The surface is emphatically not convex — it is full of
                stationary points that happen to be escapable.</>,
            },
            {
              q: <>Why is the noise in mini-batch gradients genuinely useful at a saddle?</>,
              options: [
                "It makes each step cheaper to compute",
                "The true gradient at a saddle is exactly zero, so only the noise breaks the symmetry and moves you off it",
                "It reduces overfitting",
              ],
              answer: 1,
              explain: <>Full-batch descent would sit at an exact saddle forever. A batch gradient is not zero
                there, so it perturbs you off. Cheapness and regularisation are separate benefits; this one is about
                escaping stationary points.</>,
            },
            {
              q: <>Your loss has been flat for 500 steps. What single measurement separates the possible causes?</>,
              options: [
                "The validation accuracy",
                "The gradient norm per layer — exactly zero means dead units; small but non-zero means a plateau",
                "The number of epochs completed",
              ],
              answer: 1,
              explain: <>All four causes in the table look identical on a loss curve. The gradient norm tells them
                apart immediately, and it is one line of code — which is the argument for looking at gradients
                rather than only at losses.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/momentum-and-adaptive-methods", label: <>← Momentum &amp; adaptive methods</> }}
          next={{ href: "/learn/backpropagation/vanishing-gradients", label: <>Next up · Vanishing gradients →</> }}
        />
      </div>
    </article>
  );
}
