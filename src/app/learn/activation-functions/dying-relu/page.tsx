import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeBlock } from "@/components/CodeBlock";
import { DyingReLULab } from "@/components/labs/DyingReLULab";

export const metadata = {
  title: "Dying ReLU — Manifold",
  description:
    "A unit whose input is negative on every example is gone permanently. Here it is counted rather than described — including the run that lost 19 of 64 units and scored the best accuracy anyway.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DyingReluPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The ReLU family", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 9 minutes"
        title={<>Dying ReLU</>}
        intro={<>The one genuinely new failure mode ReLU introduced. It is usually described in a sentence and left
          as a warning; it is far more useful counted, because the count tells you both how it happens and — the part
          nobody mentions — how much of it you can survive.</>}
      />

      <div className="lesson">
        <h2>The mechanism</h2>
        <p>
          Take a unit whose pre-activation <M>{String.raw`z = w^\top x + b`}</M> is negative for{" "}
          <em>every row of the training set</em>. Its output is zero on every row. Its derivative is zero on every
          row. So the gradient reaching its incoming weights is:
        </p>

        <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial w} \;=\; \sum_{n} \delta_n \cdot \mathrm{ReLU}'(z_n)\, x_n \;=\; \sum_n \delta_n \cdot 0 \cdot x_n \;=\; 0`}</MathBlock>

        <p>
          Zero, exactly. And the update is <M>{String.raw`w \leftarrow w - \eta \cdot 0 = w`}</M> — for any{" "}
          <M>{String.raw`\eta`}</M>, at any point in training, forever. The unit is not learning slowly. It is
          removed from the network, and nothing that happens later can bring it back.
        </p>

        <Callout color={CORAL} title={<>Why the usual advice does not apply</>}>
          Almost every training problem responds to lowering the learning rate. This one does not.{" "}
          <M>{String.raw`\eta \times 0 = 0`}</M> whatever <M>{String.raw`\eta`}</M> is, so reducing it at step 500
          changes nothing — the damage was done at step 1 and the parameters are frozen where they landed.
          <br /><br />
          The remedies are: <strong>restart</strong> with a smaller rate, or <strong>choose an activation whose
          derivative is never exactly zero</strong>. That is the entire reason the next page exists.
        </Callout>

        <h2>How to count them</h2>
        <p>
          &ldquo;Dead&rdquo; sounds qualitative, and it is not. A unit is dead when its derivative is below
          threshold for every training row — one forward pass and a boolean reduction:
        </p>

        <CodeBlock
          language="python"
          fromScratch={`# a is the layer's pre-activation matrix, shape (n_examples, n_units)
dead = (a <= 0).all(axis=0).sum()      # units off for EVERY row
print(f"{dead} of {a.shape[1]} units are dead")`}
        />

        <p>
          Three lines, and they belong in your diagnostic kit next to the loss curve. A flat loss with zero dead
          units is a learning-rate problem; a flat loss with a dead layer is a different problem with a different
          fix, and you cannot tell them apart from the loss curve alone.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>A network loses 19 of its 64 hidden units to this failure — 30% of the network, gone. What
            happens to its test accuracy relative to the same run with no deaths?</>}
          options={[
            "It falls sharply — a third of the capacity is gone",
            "It falls slightly",
            "It is unchanged or better",
          ]}
          nudge="Locked in. Compare ReLU and Leaky ReLU in the lab below."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Start on <strong>ReLU</strong> and watch the first two points of the coral line. Then open the
            panel at the bottom, which is the same activation across five learning rates.</>}
          insight={<>ReLU loses 24 of 64 units within forty steps and settles around 19 — and scores{" "}
            <strong>0.9190</strong>, the second-best accuracy of the five and better than Leaky ReLU&rsquo;s 0.9095,
            which lost nothing. Thirty per cent of the network died and it cost nothing measurable, because the
            survivors had enough capacity for the task. The lower panel shows where that stops being true: at lr 10,
            57 of 64 die and the accuracy collapses to chance.</>}
        >
          <DyingReLULab />
        </LabFrame>

        <h2>Three conclusions from that data</h2>
        <p>
          <strong>Dying is a property of ReLU <em>and a step size</em>, not of ReLU.</strong> Four units die at lr
          0.1; sixty die at lr 30. The activation is identical in both runs. Describing the phenomenon as
          &ldquo;ReLU&rsquo;s flaw&rdquo; hides the variable you actually control.
        </p>
        <p>
          <strong>The count matters more than the fact.</strong> Nineteen deaths was free; fifty-seven was fatal. The
          useful question is never &ldquo;are any units dead&rdquo; — some always are, and six were already off at
          initialisation in this run — but <em>is there enough network left</em>. That reframes the diagnostic from a
          binary alarm into a capacity check.
        </p>
        <p>
          <strong>Some deaths are useful.</strong> A unit that switches off is a unit not contributing; if the task
          does not need it, that is regularisation arriving for free. This is part of why the sparsity argument for
          ReLU gets made, and it is why the fix — Leaky ReLU — reliably removes the deaths and just as reliably fails
          to improve accuracy.
        </p>

        <Callout color={CORAL} title={<>Where it does bite hard</>}>
          The lab uses a 64-unit network on a two-dimensional problem, which has capacity to spare. The failure is
          much more dangerous when it is <em>concentrated</em>: an entire layer dying severs the network, and
          everything in front of it receives zero gradient regardless of how healthy those units are. The{" "}
          <Link href="/learn/backpropagation/the-learning-rate" style={link}>learning-rate page</Link> of the
          previous track has exactly that case — 16 of 16 units in one layer, and a loss curve perfectly flat for
          2,000 steps.
          <br /><br />
          So the count to watch is not the total but the <strong>count per layer</strong>. Losing 30% spread across
          the network is survivable; losing 100% of one layer is not.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why does lowering the learning rate not revive a dead ReLU unit?</>,
              options: [
                "It does, but slowly",
                "Its gradient is exactly zero, and η × 0 = 0 for any η",
                "Because the loss surface has changed shape around it",
              ],
              answer: 1,
              explain: <>The step size multiplies the gradient. Multiplying zero by a smaller number is still zero.
                The fix is to restart, or to use an activation with a non-zero negative slope.</>,
            },
            {
              q: <>In the measured run, 19 of 64 units died and the network scored the second-best accuracy of five
                activations. What is the right conclusion?</>,
              options: [
                "Dying ReLU is not a real phenomenon",
                "The damage depends on how much network is left; 19 deaths was survivable, 57 at a higher learning rate was not",
                "Dead units improve accuracy",
              ],
              answer: 1,
              explain: <>It is real and it is measurable — and it is a matter of degree. The same activation at lr 10
                lost 57 units and dropped to chance. The diagnostic question is about remaining capacity, not about
                whether the count is above zero.</>,
            },
            {
              q: <>Which dead-unit pattern is most dangerous?</>,
              options: [
                "A large total count spread evenly across all layers",
                "An entire layer dead, because everything in front of it then receives zero gradient",
                "A few units dead in the final hidden layer",
              ],
              answer: 1,
              explain: <>A severed layer blocks the backward pass entirely — the layers before it are unreachable
                however healthy they are. That is why the count should be tracked per layer rather than as a
                total.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/relu", label: <>← ReLU, and what it bought</> }}
          next={{ href: "/learn/activation-functions/the-leaky-answers", label: <>Next up · The leaky answers →</> }}
        />
      </div>
    </article>
  );
}
