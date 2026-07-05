import { StoppingRulesLab } from "@/components/labs/StoppingRulesLab";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 50)
y = 3 + 2*x + rng.normal(scale=1.5, size=50)
X = np.column_stack([np.ones_like(x), x])

theta = np.zeros(2)
lr, tol = 0.01, 1e-8
prev = np.inf
for step in range(100000):
    theta -= lr * (2/len(y)) * X.T @ (X @ theta - y)
    loss = np.mean((X @ theta - y)**2)
    if abs(prev - loss) < tol:          # stop when improvement stalls
        break
    prev = loss
print(f"stopped at step {step}, loss {loss:.4f}")`;

const codeLib = `import numpy as np
from sklearn.linear_model import SGDRegressor

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 50)
y = 3 + 2*x + rng.normal(scale=1.5, size=50)

# tol is sklearn's stopping rule: stop when loss stops improving by > tol
model = SGDRegressor(eta0=0.01, tol=1e-8, max_iter=100000)
model.fit(x.reshape(-1, 1), y)
print("stopped after", model.n_iter_, "iterations")`;

export const metadata = {
  title: "When do we stop? - Manifold",
  description: "Gradient descent is an iterative method. Learn the practical stopping signals: small gradients, tiny improvements, and validation patience.",
};

export default function WhenDoWeStopPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>When do we stop?</>}
        intro={<>
          Gradient descent does not hand you a single dramatic finish line. It quietly gets less
          wrong, then less wrong, then barely less wrong. The art is knowing when the next step is
          no longer worth taking.
        </>}
      />

      <div className="lesson">
        <p>
          Closed-form linear regression jumps straight to the answer. Gradient descent arrives by
          repeated updates, so it needs one extra decision: <em>when should the loop end?</em> Stop
          too early and the model is undertrained. Stop too late and you waste compute; in more
          flexible models, you may even start fitting noise.
        </p>

        <h2>The naive answer: pick a fixed number</h2>
        <p>
          You can run exactly 1,000 steps and call it a day. Sometimes that is fine. But a fixed
          step count depends on the learning rate, the scale of the features, the starting point,
          and the shape of the loss surface. One dataset may converge in 40 steps while another is
          still wandering at 4,000.
        </p>

        <h2>Better answer: watch the training signal</h2>
        <p>
          A run usually becomes easy to stop when one of two things gets tiny:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>
            <strong style={{ color: "var(--ink)" }}>The gradient norm</strong>: the slope of the
            surface is nearly flat, so there is not much downhill direction left.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>The loss improvement</strong>: another update
            barely lowers the cost, so the next step has little practical value.
          </li>
        </ul>

        <StoppingRulesLab />

        <p>
          Try making each threshold stricter and looser. A loose threshold stops early with a
          slightly worse line. A very strict threshold keeps polishing decimal places. Neither is
          morally wrong; the right setting depends on how much accuracy is worth compared with
          training time.
        </p>

        <h2>The practitioner answer: keep a validation eye open</h2>
        <p>
          In plain linear regression, the training bowl is convex, so more descent usually just
          gets you closer to the same optimum. But in larger models, training loss can keep falling
          while validation performance stops improving. That is where <strong>early stopping</strong>
          becomes a regularisation tool: pause when the validation signal has failed to improve for
          a few checks in a row.
        </p>
        <p>
          That waiting period is called <strong>patience</strong>. It prevents you from stopping
          because of one noisy validation tick. You give the model a few more chances, and only stop
          when the plateau looks real.
        </p>

        <h2>The three stopping rules you will actually see</h2>
        <div style={rulesGrid}>
          <RuleCard
            color="var(--c-regression)"
            title="Max steps"
            code="for step in range(T)"
            body="Useful as a hard safety cap. It prevents accidental infinite training, but it should rarely be the only rule."
          />
          <RuleCard
            color="var(--c-fundamentals)"
            title="Tolerance"
            code="if improvement < tol: stop"
            body="Good for convex optimisation. Stop when the gradient or loss change is smaller than the precision you care about."
          />
          <RuleCard
            color="var(--good)"
            title="Early stopping"
            code="if no val gain for P checks: stop"
            body="Good for flexible models. Stop when generalisation stops improving, even if training loss can still be squeezed lower."
          />
        </div>

        <h2>What not to confuse with convergence</h2>
        <p>
          A low loss is not automatically convergence. A run can have low loss and still be moving
          quickly if the learning rate is too high. A run can also have a flat gradient because it
          reached the bottom, or because features were scaled so badly that progress is painfully
          slow along one direction. This is why stopping rules and learning-rate diagnostics belong
          together.
        </p>

        <Callout color="var(--c-fundamentals)" title={<>Interview-grade answer</>}>
          "How do you decide when gradient descent has converged?" - Use a hard maximum number
            of iterations as a safety cap, then stop when the gradient norm or loss improvement is
            below a tolerance. In predictive modelling, monitor validation performance too; early
            stopping with patience halts training when validation no longer improves, which can
            reduce overfitting.
        </Callout>

        <h2>Code the stopping rule</h2>
        <p>
          The convergence check is one <code>if</code>: break when the loss stops
          improving by more than a tolerance. scikit-learn calls that tolerance
          <code>tol</code> and reports the iteration it stopped at.
        </p>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          questions={[
            {
              q: <>The gradient at your current (slope, intercept) points north-east. Which way does gradient descent step?</>,
              options: ["North-east — follow the gradient", "South-west — opposite the gradient", "It depends on the learning rate", "Toward the origin"],
              answer: 1,
              explain: <>The gradient points <em>uphill</em> — the direction of steepest increase in loss. Descent steps the opposite way. The learning rate only sets how <em>far</em>, never which direction.</>,
            },
            {
              q: <>You crank the learning rate way up and the loss starts growing every step. What&rsquo;s happening?</>,
              options: ["The model is exploring — it will settle down", "Each step overshoots the minimum and lands higher up the other side", "The data has too much noise", "The gradient is pointing the wrong way"],
              answer: 1,
              explain: <>Too large a step jumps past the bowl&rsquo;s floor and lands higher on the far wall; the next (even bigger) gradient overshoots further. That&rsquo;s divergence — the zig-zag blow-up you saw on the loss-surface lab around α &gt; 1.</>,
            },
            {
              q: <>Compared with batch gradient descent, stochastic (one-example) steps are:</>,
              options: ["Noisier per step, but far cheaper to compute", "Smoother and cheaper", "Noisier and more expensive", "Identical in direction, just smaller"],
              answer: 0,
              explain: <>One example gives a rough, noisy estimate of the true gradient — but at 1/N the cost. Mini-batches are the practical compromise: mostly-right direction, still cheap per step.</>,
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/linear-regression/batch-vs-sgd", label: <>{"<-"} Batch, stochastic, mini-batch</> }} next={{ href: "/learn/linear-regression/the-normal-equation", label: <>Next up · The normal equation →</> }} />
      </div>
    </article>
  );
}

function RuleCard({ color, title, code, body }: { color: string; title: string; code: string; body: string }) {
  return (
    <div style={{
      background: `color-mix(in srgb, ${color} 6%, var(--surface-2))`,
      border: `1px solid color-mix(in srgb, ${color} 18%, var(--border))`,
      borderRadius: 14,
      padding: "14px 15px",
    }}>
      <div className="font-display" style={{ fontSize: 14, fontWeight: 600, color, marginBottom: 6 }}>{title}</div>
      <code style={{ display: "block", color: "var(--ink)", fontSize: 12.5, marginBottom: 8 }}>{code}</code>
      <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

const rulesGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  margin: "1.4rem 0",
};




