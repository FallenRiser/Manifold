import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Momentum & adaptive methods — Manifold",
  description:
    "Momentum halved the loss against plain SGD — and plain SGD given the same effective step size matched it and beat it on test accuracy. What that honest control tells you about when momentum actually earns its keep.",
};

const CORAL = "var(--c-neural)";

export default function MomentumPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Training dynamics", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 9 minutes"
        title={<>Momentum &amp; adaptive methods</>}
        intro={<>Plain gradient descent treats every step as if the previous ones never happened, and gives every
          parameter the same step size regardless of how differently they behave. Momentum fixes the first; adaptive
          methods fix the second. Both help here — and the measurement includes a control that complicates the
          usual story.</>}
      />

      <div className="lesson">
        <h2>Momentum: remember where you were going</h2>
        <p>
          Instead of stepping along the current gradient, accumulate a running average of recent gradients and step
          along that.
        </p>

        <MathBlock>{String.raw`\mathbf{v} \;\leftarrow\; \beta\mathbf{v} + \nabla\mathcal{L} \qquad\qquad \theta \;\leftarrow\; \theta - \eta\,\mathbf{v}`}</MathBlock>

        <p>
          With <M>{String.raw`\beta = 0.9`}</M>, the velocity remembers roughly the last ten gradients. Directions
          that keep recurring reinforce; directions that flip sign cancel. In a valley whose walls are much steeper
          than its floor — where plain descent bounces across and creeps along — the bouncing cancels out and the
          creeping accumulates.
        </p>

        <h2>Adam: a step size per parameter</h2>
        <p>
          One learning rate for the whole model assumes every parameter needs steps of the same size, which is
          rarely true — the gradients at the first layer and the last can differ by orders of magnitude, as chapter 5
          measures directly. Adam keeps a running estimate of each parameter&rsquo;s gradient <em>magnitude</em> and
          divides by it.
        </p>

        <MathBlock>{String.raw`\mathbf{m} \leftarrow \beta_1\mathbf{m} + (1-\beta_1)\mathbf{g} \qquad \mathbf{v} \leftarrow \beta_2\mathbf{v} + (1-\beta_2)\mathbf{g}^2 \qquad \theta \leftarrow \theta - \eta\,\frac{\hat{\mathbf{m}}}{\sqrt{\hat{\mathbf{v}}} + \varepsilon}`}</MathBlock>

        <p>
          <M>{String.raw`\mathbf{m}`}</M> is momentum. <M>{String.raw`\mathbf{v}`}</M> tracks squared gradients, so
          dividing by <M>{String.raw`\sqrt{\hat{\mathbf{v}}}`}</M> makes each parameter&rsquo;s effective step
          roughly scale-free: a parameter with consistently tiny gradients gets a proportionally larger step. The
          hats are a bias correction — both averages start at zero, so early estimates are biased toward zero and
          are rescaled by <M>{String.raw`1/(1-\beta^t)`}</M>.
        </p>

        <h2>What we measured</h2>
        <p>
          Same 2–16–16–1 network, same seed, 400 full-batch steps, two moons.
        </p>

        <CodeOutput source="scripts/backprop_cases.py">{`      rule      lr   loss @400   test acc
       sgd     0.1      0.1985     0.8857
  momentum     0.1      0.0927     0.9190
      adam    0.01      0.0776     0.9143`}</CodeOutput>

        <p>
          Momentum halves SGD&rsquo;s loss; Adam does slightly better still. That is the result everyone reports,
          and it is where most treatments stop.
        </p>

        <Callout color={CORAL} title={<>The control that complicates it</>}>
          Momentum with <M>{String.raw`\beta = 0.9`}</M> accumulates gradients into a velocity that settles at
          roughly <M>{String.raw`1/(1-\beta) = 10\times`}</M> a single gradient. So part of its advantage is simply
          that it takes bigger steps. What happens if we give plain SGD that same factor of ten?
          <br /><br />
          <code>sgd, lr=1.0 → loss 0.1049, test accuracy <strong>0.9286</strong></code>
          <br /><br />
          It matches momentum on loss and <strong>beats every other run on test accuracy</strong>. On this problem,
          most of what momentum bought was a larger effective step — something we could have had by turning one
          dial.
        </Callout>

        <h2>So when does momentum actually earn its keep?</h2>
        <p>
          The control does not show that momentum is useless; it shows that <em>this problem</em> was not the kind
          it helps with. Two moons with 300 parameters is small, well-conditioned and full-batch — the case where
          the gradient direction is already reliable and all you need is to travel along it faster.
        </p>
        <p>
          Momentum earns its keep where the gradient direction is <em>unreliable</em>:
        </p>
        <ul>
          <li><strong>Ill-conditioned surfaces</strong> — a narrow valley, where the raw gradient points mostly
            across rather than along it. Averaging cancels the crossing and keeps the along. A larger step size
            cannot do this; it makes the bouncing worse.</li>
          <li><strong>Noisy gradients</strong> — with small mini-batches, the average of ten recent gradients is a
            better estimate of the true direction than the latest one.</li>
          <li><strong>Plateaus</strong> — accumulated velocity carries you across a flat region that would otherwise
            take thousands of tiny steps.</li>
        </ul>
        <p>
          None of those three is present here, which is exactly why the honest control came out the way it did.
          The general lesson is worth more than the specific numbers: <strong>when a method with an implicit step
          size beats one without, check whether you are measuring the method or the step size.</strong>
        </p>

        <h2>Which to use</h2>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 580 }}>
            <thead>
              <tr>
                {["optimiser", "typical lr", "reach for it when"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 22px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["SGD + momentum", "0.1 – 0.01", "vision models; often the best final accuracy, with tuning and a schedule"],
                ["Adam / AdamW", "1e-3 – 1e-4", "the default. Transformers, sparse gradients, anything you have not tuned yet"],
                ["plain SGD", "problem-dependent", "small convex problems, and as a control when you suspect step size is doing the work"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 22px 7px 0", color: j === 0 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top", lineHeight: 1.45, fontWeight: j === 0 ? 500 : 400 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Note the learning rates differ by two orders of magnitude between rows. Adam&rsquo;s division by{" "}
          <M>{String.raw`\sqrt{\hat{\mathbf{v}}}`}</M> already normalises the gradient scale, so its{" "}
          <M>{String.raw`\eta`}</M> means something different. <strong>Carrying a learning rate across optimisers
          is a category error</strong>, and a common one.
        </p>
        <p>
          The fuller treatment of optimisation — convergence, conditioning, second-order methods — belongs to the
          Optimization pillar. What this track needs you to have is enough to read a training run, which is: a
          direction, a step size, and a memory of recent directions.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Plain SGD at lr=1.0 matched momentum and beat it on test accuracy. What does that show?</>,
              options: [
                "Momentum is not useful in practice",
                "On this problem, most of momentum's benefit was a larger effective step — which this problem happened to want",
                "The momentum implementation was wrong",
              ],
              answer: 1,
              explain: <>It shows the <em>control matters</em>, not that momentum is worthless. Momentum with{" "}
                <M>{String.raw`\beta=0.9`}</M> is worth about a 10× step, and on a small well-conditioned full-batch
                problem that is nearly all of the effect. On an ill-conditioned or noisy problem the direction
                averaging does something a larger step cannot.</>,
            },
            {
              q: <>Why does Adam use a much smaller learning rate than SGD?</>,
              options: [
                "Adam is less stable",
                "It divides by the running gradient magnitude, so its η is a step in normalised units, not raw gradient units",
                "Adam takes more steps per epoch",
              ],
              answer: 1,
              explain: <>The update is <M>{String.raw`\eta\,\hat{m}/(\sqrt{\hat{v}} + \varepsilon)`}</M>, which is
                roughly scale-free. The learning rate therefore means something different, and carrying a value
                across optimisers is a category error.</>,
            },
            {
              q: <>In which situation does momentum do something a larger learning rate cannot?</>,
              options: [
                "On a smooth bowl-shaped surface",
                "In a narrow valley where the gradient points mostly across it — averaging cancels the crossing component",
                "When the learning rate is already optimal",
              ],
              answer: 1,
              explain: <>A larger step makes cross-valley oscillation worse, not better. Momentum cancels the
                alternating component and accumulates the consistent one, which is a change of direction rather than
                of magnitude — the thing a step size cannot buy.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/batch-size-and-noise", label: <>← Batch size &amp; gradient noise</> }}
          next={{ href: "/learn/backpropagation/saddles-and-plateaus", label: <>Next up · Saddles, plateaus &amp; why noise helps →</> }}
        />
      </div>
    </article>
  );
}
