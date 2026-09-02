import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeBlock } from "@/components/CodeBlock";
import { ScheduleLab } from "@/components/labs/ScheduleLab";

export const metadata = {
  title: "Learning-rate schedules — Manifold",
  description:
    "The previous page found a good constant rate. This one shows that the best constant is beaten by decaying from a rate that is, on its own, the worst in the sweep — and explains the noise floor that makes that true.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SchedulesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Training dynamics", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 9 minutes"
        title={<>Learning-rate schedules</>}
        intro={<>The previous page treated the learning rate as one number to get roughly right. It is better
          thought of as a <em>curve</em> — and the measurement here is that decaying from a rate which, held
          constant, is the worst in the sweep produces the best run in the table.</>}
      />

      <div className="lesson">
        <h2>Why a constant rate cannot finish</h2>
        <p>
          With minibatch gradients, each step is the true gradient plus noise. Near a minimum the true gradient is
          small and the noise is not, so the update is mostly noise, and the parameters rattle around the minimum
          rather than settling into it.
        </p>
        <p>
          The size of that rattle is set by the step size. Roughly, SGD with a constant rate{" "}
          <M>{String.raw`\eta`}</M> converges not to the minimum but to a <strong>noise floor</strong> — a
          stationary distribution around it whose width grows with <M>{String.raw`\eta`}</M>:
        </p>

        <MathBlock>{String.raw`\mathbb{E}\bigl[\mathcal{L}(\theta_t)\bigr] - \mathcal{L}^{*} \;\;\xrightarrow[t\to\infty]{}\;\; O\!\left(\eta\,\sigma^2\right)`}</MathBlock>

        <p>
          So a constant rate faces a dilemma with no good answer:{" "}
          <strong>large enough to travel is too large to settle</strong>. A schedule refuses the dilemma by being
          large early and small late.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Four constant rates were swept, and 0.5 was the worst — unstable, with an accuracy spread of
            0.21 across seeds. What happens if you <em>decay</em> from 0.5?</>}
          options={[
            "It stays bad — a bad rate is a bad rate",
            "It lands somewhere between the good and bad constants",
            "It beats every constant in the sweep",
          ]}
          nudge="Locked in. Compare constant 0.5 with step decay in the lab."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Select <strong>constant 0.5</strong>, note the spikes late in training, then select{" "}
            <strong>step decay</strong> — which is the same run until epoch 60. Watch what the drop does to the
            curve.</>}
          insight={<>Step decay is bit-for-bit identical to constant 0.5 for the first 60 epochs, spikes included.
            Then the rate drops by 10× and the curve goes flat and quiet at <strong>0.0933</strong> — against{" "}
            <strong>0.3292</strong> for the same run without the drop, and <strong>0.1318</strong> for the best
            constant in the sweep. The exploration was useful; it was the <em>inability to stop exploring</em> that
            was costing.</>}
        >
          <ScheduleLab />
        </LabFrame>

        <h2>What the table actually shows</h2>
        <p>
          Reading it honestly, there are three separate claims and they are not equally strong.
        </p>
        <p>
          <strong>The loss floor: large and real.</strong> Best constant 0.1318, cosine 0.0920 — the schedule
          reaches a training loss <strong>30% lower</strong>, or equivalently the best constant sits 43% above what
          decaying achieves. That is the noise-floor argument above, measured.
        </p>
        <p>
          <strong>The variance: large and real, and underrated.</strong> The loss spread across five seeds is{" "}
          <strong>0.0402</strong> for the best constant and <strong>0.0046</strong> for cosine — nearly nine times
          tighter. A decayed run is far more likely to be reproducible, which matters more than a fraction of a
          point when you are comparing two ideas.
        </p>
        <p>
          <strong>The test accuracy: small.</strong> 0.9114 for the best constant against 0.9171–0.9190 for the
          schedules — about half a point, and the constant&rsquo;s own spread is 0.043. On this problem you could
          not defend the accuracy claim from five seeds. <strong>Be clear that the schedule&rsquo;s reliable win is
          on the training loss and the variance, not on generalisation.</strong>
        </p>

        <Callout color={CORAL} title={<>The practical reframing</>}>
          A schedule is not a way to squeeze out extra accuracy. It is a way to{" "}
          <strong>stop having to choose between exploring and settling</strong> — which in turn means the rate you
          pick at the start no longer has to be safe. Constant 0.5 was the worst row in the sweep and the best
          starting point in it.
          <br /><br />
          That is why the tuning advice changes shape: with a schedule, sweep for the largest rate that does not
          diverge and let the decay handle the rest, rather than hunting for a rate that is a compromise between two
          jobs.
        </Callout>

        <h2>The four you will meet</h2>
        <ul>
          <li><strong>Step decay</strong> — multiply by 0.1 at fixed milestones. The staircase in old vision papers.
            Simple, effective, and it introduces milestones as extra hyperparameters.</li>
          <li><strong>Cosine decay</strong> — smoothly from the base rate to zero over the run. One hyperparameter,
            no milestones, and the current default. Measured best here on loss.</li>
          <li><strong>Warmup then cosine</strong> — a short linear ramp from zero first. The transformer standard.</li>
          <li><strong>Reduce-on-plateau</strong> — cut the rate when validation stops improving. Adaptive, but it
            reacts after the fact and couples your schedule to a noisy signal.</li>
        </ul>

        <CodeBlock
          language="python"
          fromScratch={`import math, torch

opt = torch.optim.SGD(model.parameters(), lr=0.5)

# Cosine to zero over the whole run -- one line, one hyperparameter.
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=total_steps)

for step in range(total_steps):
    loss = loss_fn(model(x), y)
    opt.zero_grad(); loss.backward(); opt.step()
    sched.step()                       # AFTER opt.step(), every step

# Warmup + cosine, written out, because the fused version hides the shape:
def lr_at(t, base=0.5, warm=0.05):
    frac = t / total_steps
    if frac < warm:
        return base * frac / warm                        # linear ramp up
    f = (frac - warm) / (1 - warm)
    return base * 0.5 * (1 + math.cos(math.pi * f))      # then cosine down`}
        />

        <h2>The one place warmup is not optional</h2>
        <p>
          Warmup bought essentially nothing here — 0.0913 against cosine&rsquo;s 0.0920, well inside the seed spread
          — and the honest reason is that this problem has no early instability to protect against. It exists for
          the case that does:
        </p>
        <p>
          Adam divides by a running estimate of the gradient&rsquo;s second moment. At step 1 that estimate is built
          from a single minibatch, so it is both noisy and, after bias correction, capable of producing enormous
          steps in directions the model has no evidence about. A few hundred steps of a small rate let the moment
          estimates become meaningful before the steps get large. The same applies to very large batches, where the
          first update is confident and the model is still random.
        </p>
        <p>
          So: <strong>warmup is insurance against the first few hundred steps, and on a small full-batch problem
          there is nothing to insure.</strong> Reporting it as a win here would have been reporting noise.
        </p>

        <Proof color={CORAL} title="why the noise floor is proportional to the learning rate">
          <p>
            Model the minibatch gradient as the true gradient plus zero-mean noise,{" "}
            <M>{String.raw`g_t = \nabla\mathcal{L}(\theta_t) + \xi_t`}</M> with{" "}
            <M>{String.raw`\mathbb{E}[\xi_t]=0`}</M> and{" "}
            <M>{String.raw`\mathbb{E}[\|\xi_t\|^2] = \sigma^2`}</M>. Near a minimum take the loss to be locally
            quadratic with curvature <M>{String.raw`H`}</M>, and write{" "}
            <M>{String.raw`u_t = \theta_t - \theta^*`}</M>. The update is:
          </p>
          <MathBlock>{String.raw`u_{t+1} = (I - \eta H)u_t - \eta\,\xi_t`}</MathBlock>
          <p>
            Taking the expected squared norm, the two terms are uncorrelated, so the contraction{" "}
            <M>{String.raw`(I-\eta H)`}</M> shrinks the old error while the noise injects{" "}
            <M>{String.raw`\eta^2\sigma^2`}</M> of fresh error at every step. At the stationary point of that
            recursion the two balance:
          </p>
          <MathBlock>{String.raw`\mathbb{E}\|u\|^2 \;\approx\; \frac{\eta\,\sigma^2}{2\lambda_{\min}} \quad\Longrightarrow\quad \mathbb{E}[\mathcal{L}] - \mathcal{L}^* = O(\eta\sigma^2)`}</MathBlock>
          <p>
            Two readings follow. The floor is <em>linear</em> in <M>{String.raw`\eta`}</M>, so halving the rate
            halves it — which is what the staircase in the lab is doing, twice. And the floor is proportional to{" "}
            <M>{String.raw`\sigma^2`}</M>, the gradient noise, which is inversely proportional to the batch size —
            so <strong>decaying the learning rate and growing the batch are two routes to the same
            place</strong>, a duality that large-scale training exploits directly.
          </p>
          <p>
            Note what the argument does <em>not</em> claim: a lower training loss is not automatically a better
            model. The measured accuracy gain here was half a point against a spread of four, which is exactly the
            gap between the mathematics and the thing you care about.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why can a constant learning rate not reach the minimum with minibatch gradients?</>,
              options: [
                "Because the gradient is wrong near a minimum",
                "Because gradient noise keeps injecting error at a rate proportional to η, producing a noise floor rather than convergence",
                "Because the loss surface is non-convex",
              ],
              answer: 1,
              explain: <>Each step adds <M>{String.raw`\eta^2\sigma^2`}</M> of fresh error while the contraction
                removes old error; they balance at a floor of order <M>{String.raw`\eta\sigma^2`}</M>. Shrinking{" "}
                <M>{String.raw`\eta`}</M> shrinks the floor, which is what a schedule does.</>,
            },
            {
              q: <>Constant 0.5 was the worst row in the sweep. Step decay from 0.5 was the best. What does that
                show?</>,
              options: [
                "The sweep was measured incorrectly",
                "The large rate was useful for exploring and harmful for settling — a schedule lets you have the first without paying for the second",
                "Step decay works only from large initial rates",
              ],
              answer: 1,
              explain: <>The two runs are identical for 60 epochs, spikes and all. Everything that separates them
                happens after the ×0.1 drop. The exploration was never the problem.</>,
            },
            {
              q: <>Warmup improved the loss by 0.0007 here, inside the seed spread. What is the right conclusion?</>,
              options: [
                "Warmup does not work and should be dropped",
                "This problem has no early instability to protect against; warmup insures against noisy second-moment estimates and very large batches, neither of which is present",
                "Warmup only helps with cosine decay",
              ],
              answer: 1,
              explain: <>A technique showing nothing on a problem that lacks the failure it addresses is evidence
                about the problem, not about the technique. Reporting it as a win here would have been reporting
                noise.</>,
            },
          ]}
        />

        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          The batch-size half of the duality in the proof is the{" "}
          <Link href="/learn/backpropagation/batch-size-and-noise" style={link}>next page</Link>.
        </p>

        <PrevNext
          prev={{ href: "/learn/backpropagation/the-learning-rate", label: <>← The learning rate</> }}
          next={{ href: "/learn/backpropagation/batch-size-and-noise", label: <>Next up · Batch size &amp; gradient noise →</> }}
        />
      </div>
    </article>
  );
}
