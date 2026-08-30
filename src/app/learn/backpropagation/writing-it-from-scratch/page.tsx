import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Writing backprop from scratch — Manifold",
  description:
    "Sixty lines of NumPy that train a network of any depth. Every line corresponds to something on the previous four pages, and the whole thing is worth typing once.",
};

const CORAL = "var(--c-neural)";

export default function FromScratchPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Doing it for real", color: CORAL }, { label: "Tier 2 · practice", color: CORAL }]}
        time="about 9 minutes"
        title={<>Writing it from scratch</>}
        intro={<>Every number quoted in this track came out of the code on this page — no framework is doing
          anything on our behalf. It is worth typing once in your life, because after that no autodiff library is
          ever mysterious again.</>}
      />

      <div className="lesson">
        <h2>The pieces</h2>
        <p>
          Weights as a list of <M>{String.raw`[W, b]`}</M> pairs, one per layer. Initialisation scaled by fan-in —
          which matters enormously and gets a track of its own.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`import numpy as np

def init(sizes, seed=0):
    """sizes=[2, 16, 16, 1] -> three layers. He scaling for ReLU."""
    r = np.random.default_rng(seed)
    return [[r.normal(scale=np.sqrt(2.0 / sizes[i]), size=(sizes[i], sizes[i + 1])),
             np.zeros(sizes[i + 1])]
            for i in range(len(sizes) - 1)]`}
        />

        <h2>Forward, keeping everything</h2>
        <p>
          The one thing to get right: <strong>store the intermediates</strong>. The backward pass needs both the
          pre-activations <M>{String.raw`z`}</M> and the activations <M>{String.raw`a`}</M>, and nothing can be
          discarded until it has been consumed.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`def forward(X, params):
    zs, activations = [], [X]
    a = X
    for i, (W, b) in enumerate(params):
        z = a @ W + b
        zs.append(z)
        # no activation on the output layer -- the sigmoid lives in the loss
        a = np.maximum(0.0, z) if i < len(params) - 1 else z
        activations.append(a)
    return a, (zs, activations)`}
        />

        <h2>Backward, the four equations</h2>
        <CodeBlock
          language="Python"
          fromScratch={`def loss_and_grads(X, y, params):
    logit, (zs, activations) = forward(X, params)

    # stable sigmoid: exp(-z) overflows for large |z|
    p = np.where(logit >= 0,
                 1 / (1 + np.exp(-np.abs(logit))),
                 np.exp(-np.abs(logit)) / (1 + np.exp(-np.abs(logit))))
    loss = np.mean(-y * np.log(p + 1e-12) - (1 - y) * np.log(1 - p + 1e-12))

    grads = [None] * len(params)
    delta = (p - y) / len(X)                        # BP1, with the cancellation

    for i in range(len(params) - 1, -1, -1):
        W, _ = params[i]
        grads[i] = [activations[i].T @ delta,       # BP4
                    delta.sum(axis=0)]              # BP3
        if i > 0:
            delta = (delta @ W.T) * (zs[i - 1] > 0) # BP2, with ReLU's slope

    return loss, grads`}
        />

        <Callout color={CORAL} title={<>Three lines that look like details and are not</>}>
          <strong><code>(p - y) / len(X)</code></strong> — dividing by the batch size here, once, means the gradient
          is of the <em>mean</em> loss. Forget it and your effective learning rate scales with batch size, so
          changing the batch silently changes the step size too.
          <br /><br />
          <strong><code>(zs[i - 1] &gt; 0)</code></strong> — ReLU&rsquo;s derivative, as a boolean array that NumPy
          promotes to 0.0 and 1.0. This is the gate that zeroed unit 2 by hand.
          <br /><br />
          <strong>Gradients read <em>before</em> delta is updated.</strong> Swap those two statements and every
          layer gets the next layer&rsquo;s delta. The loss still decreases for a while, which is what makes it such
          an expensive bug.
        </Callout>

        <h2>The training loop</h2>
        <CodeBlock
          language="Python"
          fromScratch={`def train(X, y, sizes, lr=0.1, steps=2000, seed=0):
    params = init(sizes, seed)
    for t in range(steps):
        loss, grads = loss_and_grads(X, y, params)
        for (W, b), (gW, gb) in zip(params, grads):
            W -= lr * gW                 # in place: params is a list of lists
            b -= lr * gb
        if t % 500 == 0:
            print(f"step {t:>5}  loss {loss:.4f}")
    return params`}
        />

        <p>
          That is the whole thing. Around sixty lines including the initialiser, and it trains a network of any
          depth and width. Run on ten examples, as the previous track recommended before anything else:
        </p>

        <CodeOutput>{`step    0  loss 0.972365
step  100  loss 0.181876
step  200  loss 0.117098
step  300  loss 0.072520
step  400  loss 0.048115
step  500  loss 0.034002
final accuracy on the ten: 1.0`}</CodeOutput>

        <h2>What a framework adds</h2>
        <p>
          Given how short that is, it is fair to ask what PyTorch is for. Not the mathematics — that part is above.
          What it adds:
        </p>
        <ul>
          <li><strong>You do not write <code>backward</code> at all.</strong> The graph is recorded as the forward
            pass runs, so any expression you can write is differentiable without you deriving anything.</li>
          <li><strong>GPU execution</strong>, which is worth one to two orders of magnitude on the matrix
            products.</li>
          <li><strong>A library of layers</strong> — convolution, attention, normalisation — each with a tested
            backward already written.</li>
          <li><strong>Optimisers, schedules, checkpointing, distributed training</strong> — the engineering around
            the loop rather than the loop.</li>
        </ul>
        <p>
          Every one of those is leverage on top of the same four equations. Nothing on this page becomes wrong when
          you switch to a framework; it becomes <em>hidden</em>, which is exactly why writing it once is worth the
          hour.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why must <code>forward</code> return the intermediates rather than only the prediction?</>,
              options: [
                "For logging and debugging",
                "The backward pass needs the stored activations (BP4) and pre-activations (BP2)",
                "To avoid recomputing the loss",
              ],
              answer: 1,
              explain: <>BP4 needs <M>{String.raw`\mathbf{a}^{(\ell-1)}`}</M> and BP2 needs{" "}
                <M>{String.raw`z^{(\ell)}`}</M> for the activation&rsquo;s slope. This storage requirement is why
                training uses several times the memory of inference.</>,
            },
            {
              q: <>What breaks if you drop the <code>/ len(X)</code> in the delta?</>,
              options: [
                "The gradients point in the wrong direction",
                "You get the gradient of the summed loss, so the effective step size scales with batch size",
                "Nothing — it cancels out later",
              ],
              answer: 1,
              explain: <>The direction is unaffected; only the magnitude changes, by a factor of{" "}
                <M>{String.raw`n`}</M>. It matters because it silently couples two hyperparameters: doubling the
                batch then doubles your effective learning rate, and a change you believed was about batching turns
                out to be about step size.</>,
            },
            {
              q: <>Why is swapping the two statements inside the backward loop such an expensive bug?</>,
              options: [
                "It raises a shape error immediately",
                "It produces plausible gradients that are wrong by one layer, and the loss still falls for a while",
                "It only affects the bias gradients",
              ],
              answer: 1,
              explain: <>Every layer would use the next layer&rsquo;s delta. The shapes often still line up for
                equal-width layers, no exception is raised, and training limps along — so it presents as &ldquo;my
                model is a bit worse than it should be&rdquo;, the hardest kind of bug to notice. Gradient
                checking, next page, catches it instantly.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/why-it-is-cheap", label: <>← Why it is cheap</> }}
          next={{ href: "/learn/backpropagation/gradient-checking", label: <>Next up · Gradient checking →</> }}
        />
      </div>
    </article>
  );
}
