import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";

export const metadata = {
  title: "Gradient checking — Manifold",
  description:
    "The method that was too slow to be an algorithm is exactly right as a test. Ten seconds of work that turns a whole class of silent bugs into loud ones.",
};

const CORAL = "var(--c-neural)";

export default function GradientCheckingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Doing it for real", color: CORAL }, { label: "Tier 2 · practice", color: CORAL }]}
        time="about 7 minutes"
        title={<>Gradient checking</>}
        intro={<>Finite differences was too slow to train with. As a <em>test</em>, that does not matter at all —
          you run it once, on a tiny network, and it tells you definitively whether the derivative you derived is
          the derivative you have.</>}
      />

      <div className="lesson">
        <h2>Two independent routes to the same number</h2>
        <p>
          A hand-written backward pass is a derivation you did with a pen, transcribed into array code. Both steps
          are error-prone, and the failure mode is the dangerous one: <strong>a wrong gradient usually still
          decreases the loss.</strong> If it points anywhere in the correct half-space, training limps forward and
          you conclude the model is merely mediocre.
        </p>
        <p>
          Gradient checking removes the guesswork by computing the same quantity a completely different way and
          comparing.
        </p>

        <MathBlock>{String.raw`\text{relative difference} \;=\; \frac{\lVert \mathbf{g}_{\text{analytic}} - \mathbf{g}_{\text{numeric}} \rVert}{\lVert \mathbf{g}_{\text{analytic}} \rVert + \lVert \mathbf{g}_{\text{numeric}} \rVert}`}</MathBlock>

        <p>
          The <em>relative</em> difference matters. An absolute difference of{" "}
          <M>{String.raw`10^{-4}`}</M> is excellent if the gradients are of size 100 and catastrophic if they are
          of size <M>{String.raw`10^{-6}`}</M>, and gradient magnitudes vary hugely between layers — as chapter 5
          will show in some detail.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`def gradient_check(X, y, params, h=1e-6):
    _, grads = loss_and_grads(X, y, params)
    theta = flatten(params)
    analytic = flatten(grads)

    numeric = np.zeros_like(theta)
    for k in range(len(theta)):
        up, dn = theta.copy(), theta.copy()
        up[k] += h
        dn[k] -= h
        lu, _ = loss_and_grads(X, y, unflatten(up, params))
        ld, _ = loss_and_grads(X, y, unflatten(dn, params))
        numeric[k] = (lu - ld) / (2 * h)

    return (np.linalg.norm(analytic - numeric)
            / (np.linalg.norm(analytic) + np.linalg.norm(numeric)))`}
        />

        <h2>What the number should be</h2>
        <p>
          Run on a 2–8–8–1 tanh network with 105 parameters, sweeping <M>{String.raw`h`}</M>:
        </p>

        <CodeOutput>{`  h = 1e-02   relative difference = 9.813e-06
  h = 1e-04   relative difference = 9.831e-10
  h = 1e-06   relative difference = 8.800e-10
  h = 1e-08   relative difference = 7.953e-08
  h = 1e-10   relative difference = 8.212e-06`}</CodeOutput>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr>
                {["relative difference", "verdict"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 26px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["< 1e-7", "correct", "var(--good)"],
                ["1e-7 to 1e-5", "probably fine — check h and whether ReLU kinks are involved", "var(--warn)"],
                ["1e-5 to 1e-3", "suspicious; likely a real bug in one layer", "var(--warn)"],
                ["> 1e-3", "definitely a bug", "var(--bad)"],
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: "7px 26px 7px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontFamily: "ui-monospace, monospace", fontSize: 13 }}>{row[0]}</td>
                  <td style={{ padding: "7px 26px 7px 0", color: row[2], borderBottom: "1px solid var(--border)" }}>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Notice that <M>{String.raw`h = 10^{-4}`}</M> and <M>{String.raw`10^{-6}`}</M> both land near{" "}
          <M>{String.raw`10^{-9}`}</M>, and both smaller values are <em>worse</em>. If your check is failing, try a
          larger <M>{String.raw`h`}</M> before concluding your gradient is wrong — the tempting instinct to make{" "}
          <M>{String.raw`h`}</M> tiny is exactly backwards.
        </p>

        <Callout color={CORAL} title={<>The ReLU trap</>}>
          ReLU is not differentiable at zero, and finite differences straddles it. If a pre-activation sits very
          close to zero, the two probe points can land on opposite sides of the kink and the numeric estimate will
          be the average of slopes 0 and 1 — <strong>a genuine mismatch that is not a bug.</strong>
          <br /><br />
          Two ways through: run the check with <code>tanh</code> instead, which is smooth everywhere and is why the
          numbers above were measured that way; or check which parameters disagree, and forgive the ones whose{" "}
          <M>{String.raw`z`}</M> is within <M>{String.raw`h`}</M> of zero. Reaching for the second explanation
          before ruling out an actual bug is how people talk themselves out of a real failure.
        </Callout>

        <h2>How to actually run it</h2>
        <ul>
          <li><strong>Tiny network, tiny batch.</strong> 2–3–3–1 on five examples. The cost is{" "}
            <M>{String.raw`O(P)`}</M> passes, so this must stay small — and a bug that exists at all exists at that
            size.</li>
          <li><strong>Use <code>float64</code>.</strong> In <code>float32</code> the cancellation floor is around{" "}
            <M>{String.raw`10^{-3}`}</M> and the check cannot distinguish a bug from arithmetic. This alone
            explains most &ldquo;my gradient check always fails&rdquo; reports.</li>
          <li><strong>Check per layer, not just in aggregate.</strong> One broken layer among six can hide in a
            norm over all parameters. Reporting the worst layer localises the bug immediately.</li>
          <li><strong>Turn off anything random.</strong> Dropout resamples its mask between the two probe calls,
            so you are differencing two different functions and the check fails for a reason that has nothing to do
            with your gradient.</li>
          <li><strong>Then delete it from the training loop.</strong> It is a test, not a step.</li>
        </ul>

        <DecisionPoint
          accent={CORAL}
          question={<>You wrote a backward pass by hand. The loss decreases and the model reaches 84% where you
            expected around 90%. What do you do first?</>}
          options={[
            {
              label: "Tune the learning rate and architecture",
              verdict: "miss",
              response: <>This is the trap the page exists for. A gradient that is wrong but points roughly
                downhill produces exactly this symptom — a model that trains, and underperforms. Every hour of
                tuning is spent optimising around a bug, and any conclusion you draw about architecture will be
                drawn from corrupted evidence.</>,
            },
            {
              label: "Compare against a framework implementation",
              verdict: "close",
              response: <>A genuinely good check, and conclusive when the architectures match exactly. But making
                them match — same init, same loss reduction, same layer conventions — is often more work than the
                check itself, and any mismatch there produces a difference you then have to explain.</>,
            },
            {
              label: "Run a gradient check on a tiny network",
              verdict: "best",
              response: <>Ten seconds, and it partitions the problem. Below <M>{String.raw`10^{-7}`}</M> the
                gradient is right and the 84% is a real modelling question. Above <M>{String.raw`10^{-3}`}</M>{" "}
                there is a bug and no amount of tuning was ever going to help. Either way you have converted a vague
                disappointment into a definite fact.</>,
            },
          ]}
        />

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is a subtly wrong gradient more dangerous than an obviously broken one?</>,
              options: [
                "It is harder to fix once found",
                "If it points roughly downhill the loss still falls, so training appears to work and the model is just quietly worse",
                "It causes NaNs later in training",
              ],
              answer: 1,
              explain: <>Any direction within 90° of the true gradient decreases the loss. The model trains, reaches
                a mediocre score, and every subsequent experiment is run on top of the bug.</>,
            },
            {
              q: <>Your gradient check reports 3e-4. What should you try before assuming a bug?</>,
              options: [
                "A much smaller h",
                "A larger h, and float64 rather than float32",
                "More training steps before checking",
              ],
              answer: 1,
              explain: <>Accuracy peaks around <M>{String.raw`h = 10^{-6}`}</M> and degrades for smaller values
                through cancellation — so shrinking <M>{String.raw`h`}</M> makes it worse. In{" "}
                <M>{String.raw`\texttt{float32}`}</M> the floor is around <M>{String.raw`10^{-3}`}</M> regardless
                of your code, which is a very common false alarm.</>,
            },
            {
              q: <>Why must dropout be disabled during a gradient check?</>,
              options: [
                "Dropout has no gradient",
                "It resamples between the two probe evaluations, so you are differencing two different functions",
                "It makes the check too slow",
              ],
              answer: 1,
              explain: <>Finite differences assumes the same deterministic function at both probe points. Any
                resampled randomness breaks that assumption, and the check fails for reasons unrelated to your
                backward pass. Dropout does have a well-defined gradient given a fixed mask.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/writing-it-from-scratch", label: <>← Writing it from scratch</> }}
          next={{ href: "/learn/backpropagation/automatic-differentiation", label: <>Next up · Automatic differentiation →</> }}
        />
      </div>
    </article>
  );
}
