import Link from "next/link";
import { StoppingRulesLab } from "@/components/labs/StoppingRulesLab";

export const metadata = {
  title: "When do we stop? - Manifold",
  description: "Gradient descent is an iterative method. Learn the practical stopping signals: small gradients, tiny improvements, and validation patience.",
};

export default function WhenDoWeStopPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Core idea</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>&middot; about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        When do we stop?
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Gradient descent does not hand you a single dramatic finish line. It quietly gets less
        wrong, then less wrong, then barely less wrong. The art is knowing when the next step is
        no longer worth taking.
      </p>

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

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            Interview-grade answer
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            "How do you decide when gradient descent has converged?" - Use a hard maximum number
            of iterations as a safety cap, then stop when the gradient norm or loss improvement is
            below a tolerance. In predictive modelling, monitor validation performance too; early
            stopping with patience halts training when validation no longer improves, which can
            reduce overfitting.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/batch-vs-sgd" style={navLink}>{"<-"} Batch, stochastic, mini-batch</Link>
          <Link href="/learn/linear-regression/the-normal-equation" style={navLink}>Next up · The normal equation →</Link>
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

const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };

const callout: React.CSSProperties = {
  background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))",
  border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))",
  borderRadius: 12,
  padding: "13px 15px",
  margin: "1.8rem 0 0",
};
