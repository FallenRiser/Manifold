import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The bugs you will actually hit — Manifold",
  description:
    "Six gradient bugs, ordered by how long they take to find. What they share is that none of them raises an exception and all of them still reduce the loss.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BackpropBugsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Doing it for real", color: CORAL }, { label: "Tier 2 · practice", color: CORAL }]}
        time="about 8 minutes"
        title={<>The bugs you will actually hit</>}
        intro={<>Not a general debugging guide — six specific gradient bugs, each of which produces a model that
          trains. That is what they have in common, and it is what makes them expensive: none of them announces
          itself, and every one of them just makes your model quietly worse.</>}
      />

      <div className="lesson">
        <h2>1. Forgetting to zero the gradients</h2>
        <p>
          The most common by a wide margin, and it follows directly from accumulation being the correct default.
        </p>
        <CodeBlock
          language="Python"
          fromScratch={`# wrong
for xb, yb in loader:
    loss = criterion(model(xb), yb)
    loss.backward()
    optimizer.step()          # .grad still holds every previous batch`}
        />
        <p>
          <strong>Symptom:</strong> training is unstable and gets worse over an epoch, because the accumulated
          gradient grows without bound — effectively a learning rate that increases every step.{" "}
          <strong>Tell:</strong> the first few steps look fine and it degrades from there.
        </p>

        <h2>2. Reading the gradients after updating delta</h2>
        <p>
          The hand-written equivalent, and the one that survives longest undetected.
        </p>
        <CodeBlock
          language="Python"
          fromScratch={`# wrong: delta is overwritten before it is used
for i in range(len(params) - 1, -1, -1):
    W, _ = params[i]
    if i > 0:
        delta = (delta @ W.T) * act_grad(zs[i - 1])
    grads[i] = [activations[i].T @ delta, delta.sum(0)]   # <- one layer late`}
        />
        <p>
          <strong>Symptom:</strong> the model trains and underperforms. With equal-width layers the shapes still
          line up, so nothing raises. <strong>Tell:</strong> a gradient check fails immediately, which is the entire
          argument for running one.
        </p>

        <h2>3. Applying the activation derivative at the wrong point</h2>
        <p>
          <M>{String.raw`g'`}</M> must be evaluated at the <em>pre</em>-activation{" "}
          <M>{String.raw`z`}</M>, not at the activation <M>{String.raw`a`}</M>.
        </p>
        <CodeBlock
          language="Python"
          fromScratch={`delta = (delta @ W.T) * (a[i - 1] > 0)      # wrong -- a is already >= 0
delta = (delta @ W.T) * (z[i - 1] > 0)      # right`}
        />
        <p>
          For ReLU this is quietly devastating: <M>{String.raw`a \ge 0`}</M> always, so{" "}
          <code>a &gt; 0</code> is true wherever <M>{String.raw`a \ne 0`}</M> — which looks nearly right and lets
          gradient through units that were off, at the boundary. <strong>Tell:</strong> the check fails on the
          hidden layers and passes on the output layer.
        </p>

        <Callout color={CORAL} title={<>Why sigmoid hides this bug and ReLU does not</>}>
          For sigmoid the derivative is conventionally written <M>{String.raw`a(1-a)`}</M> — genuinely in terms of{" "}
          <M>{String.raw`a`}</M> — so code that passes <M>{String.raw`a`}</M> around is correct there and{" "}
          <em>looks</em> correct when ported to ReLU. This is a good example of why a convenience identity is worth
          knowing as an identity rather than as the definition.
        </Callout>

        <h2>4. Averaging twice, or not at all</h2>
        <p>
          Divide by the batch size in the loss <em>and</em> again in the delta and your gradients are{" "}
          <M>{String.raw`n`}</M> times too small; do neither and they are <M>{String.raw`n`}</M> times too large.
        </p>
        <p>
          <strong>Symptom:</strong> the model trains, but the working learning rate is bizarre — 1e-6 or 100 rather
          than something around 0.01. <strong>Tell:</strong> changing the batch size changes the best learning rate
          proportionally, when it should barely move it.
        </p>

        <h2>5. Mismatching the output activation and the loss</h2>
        <CodeBlock
          language="Python"
          fromScratch={`probs = torch.softmax(logits, dim=1)
loss  = F.cross_entropy(probs, y)     # wrong: cross_entropy applies softmax itself`}
        />
        <p>
          Softmax is applied twice, which flattens the distribution and shrinks every gradient.{" "}
          <strong>Symptom:</strong> training is far slower than it should be and accuracy plateaus low.{" "}
          <strong>Tell:</strong> your predicted probabilities are suspiciously uniform. The{" "}
          <Link href="/learn/perceptron-to-mlp/the-output-layer" style={link}>output-layer page</Link> covers why
          the fused form exists.
        </p>

        <h2>6. In-place operations on values the tape needs</h2>
        <CodeBlock
          language="Python"
          fromScratch={`h = layer(x)
h += bias          # in-place: the saved value for backward is now wrong
h = h + bias       # safe`}
        />
        <p>
          Sometimes this raises; sometimes it silently corrupts a saved tensor. <strong>Tell:</strong> results
          change when you reorder operations that should be independent.
        </p>

        <h2>The order to work through them</h2>
        <p>
          Every bug above passes the &ldquo;does it run&rdquo; test and most pass &ldquo;does the loss go
          down&rdquo;. So the diagnosis has to be structural rather than observational:
        </p>
        <ol>
          <li><strong>Gradient check on a tiny network.</strong> Catches 2, 3, 4 and 6 outright. Ten seconds.</li>
          <li><strong>Overfit ten examples.</strong> If the loss will not reach ~0, something is broken rather than
            merely suboptimal — the test from the{" "}
            <Link href="/learn/perceptron-to-mlp/the-training-loop" style={link}>previous track</Link>.</li>
          <li><strong>Print the predicted probabilities.</strong> Uniform output points straight at 5.</li>
          <li><strong>Sweep the learning rate by powers of ten.</strong> If the working value is absurd, suspect
            4.</li>
          <li><strong>Only then</strong> think about architecture, capacity or data.</li>
        </ol>

        <Callout color={CORAL} title={<>The habit worth taking from this page</>}>
          <strong>&ldquo;The loss went down&rdquo; is not evidence that your gradient is correct.</strong> Any
          direction within 90° of the true gradient decreases the loss, and that is an enormous space of wrong
          answers. Correctness has to be established by a check that is independent of training — which is why
          gradient checking is worth its ten seconds every single time you write a backward pass by hand.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What do all six bugs on this page have in common?</>,
              options: [
                "They raise exceptions that are hard to read",
                "They produce a model that still trains, so the loss curve does not reveal them",
                "They only appear in deep networks",
              ],
              answer: 1,
              explain: <>That is precisely what makes them expensive. A crash is free to diagnose; a model that
                trains to 84% instead of 90% can absorb weeks of architecture tuning before anyone suspects the
                gradient.</>,
            },
            {
              q: <>Why is using <code>a &gt; 0</code> instead of <code>z &gt; 0</code> for ReLU&rsquo;s derivative
                a bug?</>,
              options: [
                "They are equivalent, so it is not a bug",
                "a is the post-ReLU value and is never negative, so the mask no longer identifies which units were off",
                "a has the wrong shape",
              ],
              answer: 1,
              explain: <>ReLU has already clamped negatives to zero, so <M>{String.raw`a \ge 0`}</M> everywhere and
                the test degenerates. The shapes are identical, which is exactly why nothing complains.</>,
            },
            {
              q: <>Your model works best at a learning rate of 1e-7, and doubling the batch size roughly halves the
                best rate. What do you suspect?</>,
              options: [
                "The learning rate is genuinely that small for this problem",
                "A batch-size normalisation bug — you are averaging twice or not at all",
                "Vanishing gradients",
              ],
              answer: 1,
              explain: <>A correctly averaged gradient makes the good learning rate largely independent of batch
                size. A systematic factor of <M>{String.raw`n`}</M> shows up as both an absurd absolute value and a
                proportional coupling to the batch size — which is the diagnostic signature.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/automatic-differentiation", label: <>← Automatic differentiation</> }}
          next={{ href: "/learn/backpropagation/the-learning-rate", label: <>Next up · The learning rate →</> }}
        />
      </div>
    </article>
  );
}
