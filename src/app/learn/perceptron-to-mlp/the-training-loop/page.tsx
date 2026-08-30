import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "The training loop — Manifold",
  description:
    "Five lines that never change, whatever the model. Plus the vocabulary — epoch, batch, step — that is used loosely everywhere and causes real confusion when it is.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TrainingLoopPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Making it learn", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 8 minutes"
        title={<>The training loop</>}
        intro={<>Every neural network ever trained has been trained by the same five lines. Frameworks decorate
          them, distributed training parallelises them, but if you can write these from memory you can read any
          training script in the world.</>}
      />

      <div className="lesson">
        <h2>The five lines</h2>
        <CodeBlock
          language="Python"
          fromScratch={`for epoch in range(n_epochs):
    for xb, yb in batches(X, y, batch_size):
        y_hat = forward(xb, params)          # 1. predict
        loss  = loss_fn(y_hat, yb)           # 2. score it
        grads = backward(loss, params)       # 3. slope for every parameter
        update(params, grads, lr)            # 4. step downhill
    validate(params, X_val, y_val)           # 5. check on unseen data`}
        />

        <p>
          Predict, score, differentiate, step, check. In PyTorch that is{" "}
          <code>forward</code> / <code>criterion</code> / <code>loss.backward()</code> /{" "}
          <code>optimizer.step()</code>, plus <code>optimizer.zero_grad()</code> to clear the last iteration&rsquo;s
          gradients — the one line with no conceptual content and the one people most often forget, because
          gradients accumulate by default.
        </p>

        <h2>Epoch, batch, step</h2>
        <p>
          These three words get used interchangeably in conversation and mean genuinely different things.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 540 }}>
            <thead>
              <tr>
                {["term", "what it is", "with n = 10,000, batch = 32"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 22px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["batch", "the group of examples in one forward pass", "32 examples"],
                ["step", "one parameter update — one batch", "313 per epoch"],
                ["epoch", "one full pass over the training set", "313 steps"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 22px 7px 0", color: j === 0 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          The distinction that matters: <strong>the model learns per step, not per epoch.</strong> Training for 10
          epochs at batch size 32 gives 3,130 updates; the same 10 epochs at batch size 512 gives 200. Those are
          very different amounts of learning from identical-sounding settings, and it is the usual explanation when
          someone increases the batch size for speed and finds the model has stopped improving.
        </p>

        <Callout color={CORAL} title={<>Why batches at all</>}>
          Computing the gradient on all 10,000 examples gives the most accurate descent direction available — and
          it is usually the wrong choice. It costs a full pass per update, so you get 10 updates where batching
          would give you 3,130, and the noise batching introduces turns out to be <em>useful</em>: a noisy gradient
          can bounce out of a poor region that a clean one would settle into. Small batches are not an approximation
          you tolerate for memory reasons. They typically generalise better, which is one of the more surprising
          empirical facts in the field.
        </Callout>

        <h2>Reading the loss curve</h2>
        <p>
          The training loop&rsquo;s only output you should ever look at first is the pair of curves — training loss
          and validation loss against step. Nearly every diagnosis starts here.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 580 }}>
            <thead>
              <tr>
                {["what you see", "what it means", "what to do"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 20px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["both fall, then flatten together", "healthy; capacity-limited", "bigger model, or accept it"],
                ["train falls, validation rises", "overfitting", "stop earlier, regularise, more data"],
                ["neither moves at all", "not learning", "learning rate, scaling, or a bug"],
                ["loss becomes NaN", "diverged", "lower the learning rate first"],
                ["loss jumps around wildly", "step size too large for the batch", "lower lr, or raise batch size"],
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
          Row three is worth a warning. <strong>&ldquo;Nothing is happening&rdquo; is the least diagnostic symptom
          available</strong> — it is produced by a learning rate three orders of magnitude too small, by unscaled
          inputs, by a dead activation, and by a genuine bug, and the curve looks identical in all four cases. The
          next page is about telling them apart.
        </p>

        <h2>Overfit one batch first</h2>
        <p>
          Before running a real training job, take ten examples and train on nothing else until the model gets all
          ten right. A hand-rolled 2 → 16 → 1 network, learning rate 0.15, 500 steps:
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`Xs, ys = X[:10], y[:10]                     # ten examples, nothing else
for step in range(501):
    loss = train_step(Xs, ys, params, lr=0.15)
    if step % 100 == 0:
        print(f"step {step:>4}  loss {loss:.6f}")

print("final accuracy on the ten:", accuracy(Xs, ys, params))`}
        />
        <CodeOutput>{`step    0  loss 0.972365
step  100  loss 0.181876
step  200  loss 0.117098
step  300  loss 0.072520
step  400  loss 0.048115
step  500  loss 0.034002
final accuracy on the ten: 1.0`}</CodeOutput>

        <p>
          All ten correct, and the loss falling steadily toward zero with no sign of a floor. That is what a healthy
          loop looks like.
        </p>

        <p>
          This is the single highest-value habit in the chapter. A model with enough capacity <em>must</em> be able
          to memorise ten examples — there is no generalisation being asked for, so nothing but a defect can stop
          it. If the loss will not go to zero here, the problem is in your code, your shapes, your learning rate or
          your data pipeline, and it is <strong>not</strong> in your architecture or your dataset size. You have
          converted a vague &ldquo;it does not work&rdquo; into a bounded search over about thirty lines.
        </p>
        <p>
          The same reasoning appears in the{" "}
          <Link href="/learn/data-workflow/start-with-a-baseline" style={link}>data workflow</Link> pillar as{" "}
          &ldquo;complete the circuit cheaply before optimising anything inside it&rdquo;. Here the circuit is the
          training loop itself.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>You raise the batch size from 32 to 512 to train faster, and the model ends up much worse at the
                same number of epochs. Why?</>,
              options: [
                "Large batches always generalise worse",
                "You cut the number of parameter updates by 16×; the same epochs are far less learning",
                "The learning rate needs to be lowered for large batches",
              ],
              answer: 1,
              explain: <>Learning happens per <em>step</em>. 10 epochs at batch 32 is 3,130 updates; at batch 512 it
                is 196. The usual fix is to raise the learning rate roughly with the batch size, or train more
                epochs. Large batches do tend to generalise slightly worse, but a 16× cut in updates is the dominant
                effect here.</>,
            },
            {
              q: <>Your model cannot drive the loss to zero on ten examples. What have you learned?</>,
              options: [
                "The architecture is too small for the task",
                "The bug is in the code, shapes, learning rate or data pipeline — not in the dataset or the model's capacity",
                "You need more training data",
              ],
              answer: 1,
              explain: <>Memorising ten examples requires no generalisation, so dataset size and difficulty are
                ruled out immediately. Any model with meaningful capacity can do it. Failing the test localises the
                fault to the plumbing, which is exactly why the test is worth running first.</>,
            },
            {
              q: <>Training loss keeps falling while validation loss has started rising. What is the situation?</>,
              options: [
                "The learning rate is too high",
                "The model is overfitting — it is now learning things specific to the training set",
                "The validation set is too small",
              ],
              answer: 1,
              explain: <>Diverging curves is the definition of overfitting, and the point where validation turns is
                where early stopping would halt. A too-high learning rate makes <em>both</em> curves erratic rather
                than separating them cleanly.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/from-the-rule-to-a-loss", label: <>← From the rule to a loss</> }}
          next={{ href: "/learn/perceptron-to-mlp/capacity-you-can-see", label: <>Next up · Capacity you can see →</> }}
        />
      </div>
    </article>
  );
}
