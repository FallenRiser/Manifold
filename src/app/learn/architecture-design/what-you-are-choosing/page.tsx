import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { ARCH_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "What you are actually choosing — Manifold",
  description:
    "Depth and width are not the thing you want. They are two knobs that jointly set capacity, cost, and trainability — and the thing you want is test accuracy, which none of the three controls directly.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatYouAreChoosingPage() {
  const fromScratch = `# The cost axis is pure arithmetic -- you can price an architecture
# before you train it. A layer from a inputs to b units has a*b weights
# plus b biases.
for hidden in [(32, 32), (64,) * 8]:
    print(f"{str(hidden):>26}  ->  {count_params(hidden):>6} parameters")`;

  const withLibrary = `# Does 25x the parameters buy accuracy? Train both and look.
# (Single seed, so these wobble a little around the 5-seed means in the text.)
for hidden in [(32, 32), (64,) * 8]:
    tr, te = fit_mlp(hidden)
    print(f"{str(hidden):>26}  params={count_params(hidden):>6}  test={te}")`;

  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Neural networks", color: CORAL },
          { label: "Core idea", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>What you are actually choosing</>}
        intro={<>Every learner&rsquo;s first question is &ldquo;how many layers, how many neurons?&rdquo; The
          answer begins with a correction: those are not the quantities you care about. They are knobs that
          set three other quantities — capacity, cost, and trainability — and it is those three that decide
          whether your network will work.</>}
      />

      <div className="lesson">
        <h2>The thing you want versus the things you control</h2>
        <p>
          The thing you want is test accuracy. You do not control it directly. What you control is the
          architecture: how many layers (depth <M>{String.raw`D`}</M>), how many units per layer
          (width <M>{String.raw`W`}</M>), and which activation function you use. Those three choices
          determine a network&rsquo;s <strong>parameter count</strong>, its <strong>capacity</strong>, and
          its <strong>trainability</strong> — and those properties, together with the data and the
          optimiser, produce the test accuracy you actually wanted.
        </p>
        <p>
          This distinction matters because it stops you from asking the wrong question. &ldquo;How many
          neurons should I use for this dataset?&rdquo; has no closed-form answer. &ldquo;Do I have enough
          capacity to fit this data, and is the cost of that capacity justified by the improvement?&rdquo;
          is a question you can answer by looking at two numbers you already have: the training loss and
          the parameter count.
        </p>

        <h2>Axis 1: capacity</h2>
        <p>
          Capacity is the set of functions the network can represent. A network with one hidden unit and a
          ReLU activation can represent any piecewise-linear function with at most two pieces. A network
          with 64 hidden units can represent functions with up to 64 pieces. Neither of those sentences
          tells you whether the function you need is in the set — but they tell you that the first network
          cannot represent anything the second cannot, and the second can represent many things the first
          cannot.
        </p>
        <p>
          On the running problem in this track, a single hidden unit achieves test accuracy 0.641. That is
          barely above the 0.500 baseline of guessing the majority class, and the training accuracy is
          almost as low: the network cannot fit the data, not because the optimiser failed but because no
          function in its representable set is close to the true boundary. At 16 units the test accuracy
          is 0.946. At 64 it is 0.919. At 256 it is 0.918. The capacity you need for this problem is
          somewhere around 16 units; everything above that is capacity you are paying for but not using.
        </p>

        <Callout color={CORAL} title={<>Capacity is necessary, not sufficient</>}>
          A network with 256 hidden units can represent the true boundary — 16 units already proved that.
          But having the function in the set does not mean the optimiser will find it. The 256-unit network
          scores 0.918, slightly below the 16-unit network&rsquo;s 0.946, because the loss surface is
          harder to navigate when most of the parameters are redundant. <strong>Capacity tells you what is
          reachable; it does not tell you what will be reached.</strong>
        </Callout>

        <PredictPrompt
          prompt={<>You take the depth-2, width-32 network and grow it to depth-8, width-64 — twenty-five
            times the parameters. What happens to test accuracy on this problem?</>}
          options={[
            "It climbs — more capacity, better fit",
            "It stays about the same — the extra capacity is wasted but harmless",
            "It drops — the bigger network is actually a little worse",
          ]}
          nudge={<>Locked in. Price both networks by hand, then train them and read the last column.</>}
        />

        <h2>Axis 2: cost</h2>
        <p>
          Every parameter is a floating-point number that must be stored, initialised, updated, and
          checkpointed. The cost is not abstract. A depth-2, width-32 network on this problem has 1,185
          parameters. A depth-8, width-64 network has 29,377 — twenty-five times more. The deeper, wider
          network scores 0.932 on the test set, which is <em>lower</em> than the 0.953 achieved by the
          smaller one. You paid twenty-five times as much and got less.
        </p>

        <CodeBlock setup={ARCH_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <p>
          The counter is worth sitting with: the deeper, wider network is not just a worse deal, it is a
          worse <em>model</em> on this data. Capacity it cannot use becomes loss surface it has to navigate,
          and the optimiser navigates it slightly less well. More is not free, and here it is not even
          better.
        </p>
        <p>
          Parameters are the fixed cost of a network: they sit in memory whether you are training or
          predicting, whether your batch has one example or a thousand. The variable cost is the
          activations — the intermediate values each layer produces for each example in the batch. Those
          scale with batch size and with depth, and they dominate memory during training because
          backpropagation must hold them all until the backward pass uses them. On the backpropagation
          track you measured this: parameter memory was 3.16 MB at every batch size, while activation
          memory ranged from 0.82 MB at batch 32 to 26.22 MB at batch 1024.
        </p>
        <p>
          So when you double the width of every layer, you quadruple the parameter count (because each
          layer&rsquo;s weight matrix is <M>{String.raw`W \times W`}</M>), and you also quadruple the
          activation memory per example. When you double the depth, you roughly double both quantities but
          add a second cost that width does not: you lengthen the gradient path, making the network harder
          to train. That is the third axis.
        </p>

        <h2>Axis 3: trainability</h2>
        <p>
          A deep network is not just a wide network rotated ninety degrees. Depth introduces serial
          dependence: the gradient of the loss with respect to the first layer&rsquo;s weights passes
          through every subsequent layer on its way back. Each layer multiplies the gradient by the local
          Jacobian, and those multiplications compound.
        </p>
        <p>
          You saw this on the{" "}
          <Link href="/learn/backpropagation" style={link}>backpropagation track</Link>: the chain-rule
          product across <M>{String.raw`D`}</M> layers is a product of <M>{String.raw`D`}</M> factors, and
          if those factors are consistently below 1 the gradient vanishes, while if they are consistently
          above 1 it explodes. Activation functions, initialisation schemes, and normalisation layers
          exist to keep those factors near 1, but they cannot do it perfectly, and the longer the product
          the less room for error.
        </p>
        <p>
          On this track&rsquo;s grid search, depth-8 networks at width 4 collapse entirely — test accuracy
          0.654, worse than a single wide layer. At width 64 the depth-8 network recovers to 0.932, but
          it still falls short of the depth-2 network&rsquo;s 0.953. The width had to compensate for the
          trainability cost that depth introduced. On problems that do not require compositional features
          — and many tabular problems do not — that is a net loss.
        </p>

        <Proof color={CORAL} title="the grid that makes this concrete">
          <p>
            A grid of MLPs is trained on the make_moons dataset
            (1,000 samples, noise 0.25, 5-fold cross-validated, 10 seeds per cell). Each cell reports the
            mean test accuracy and its standard deviation. The grid varies depth from 1 to 8 and width
            from 4 to 64.
          </p>
          <p>
            The best cell is depth 2, width 32: <strong>0.953</strong> test accuracy with 1,185
            parameters. The worst non-degenerate cell is depth 8, width 4: <strong>0.654</strong> with 137
            parameters. The most expensive cell is depth 8, width 64: <strong>0.932</strong> with 29,377
            parameters. Every page in this chapter draws on this grid to separate what the numbers say
            from what intuition expects.
          </p>
        </Proof>

        <h2>Why the three axes are not independent</h2>
        <p>
          Capacity and cost are nearly proportional: more parameters means more capacity, and you cannot
          have one without the other. But trainability cuts across both. A deep-narrow network and a
          shallow-wide network can have similar parameter counts and similar theoretical capacity, yet the
          deep-narrow one may fail to train because the gradient product is too long. This is why
          architecture design is a search and not a formula: the three axes interact, and the interaction
          depends on the data, the activation function, and the optimiser.
        </p>
        <p>
          The rest of this chapter makes the interaction precise. The next page counts parameters — the
          cost axis — so you can predict what a proposed architecture will cost before you train it. The
          page after that takes the capacity axis and pins it to measured numbers rather than theorems. By
          the end of the chapter you will know what the three knobs do individually, which prepares you for
          Chapter 2 (width) and Chapter 3 (depth), where you will see what happens when they fight.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>On the running problem, depth 2 / width 32 scores 0.953 with 1,185 parameters while depth 8 /
                width 64 scores 0.932 with 29,377 parameters. Which axis explains the gap?</>,
              options: [
                "Capacity — the deeper network cannot represent the boundary",
                "Cost — the deeper network runs out of memory",
                "Trainability — the deeper network has enough capacity but the longer gradient path makes the optimiser less effective",
              ],
              answer: 2,
              explain: <>The depth-8 network has far more parameters and therefore more capacity than the
                depth-2 network. It is not a memory problem on this scale. The issue is that the gradient
                must pass through 8 layers, and the compounding Jacobian factors degrade the update
                signal.</>,
            },
            {
              q: <>A network with 256 hidden units scores 0.918, below the 16-unit network&rsquo;s 0.946.
                Does this mean the 256-unit network lacks capacity?</>,
              options: [
                "Yes — 256 units cannot represent the boundary",
                "No — 16 units already fit it, so 256 can too; the lower score is an optimisation or generalisation issue, not a capacity issue",
                "It depends on the activation function",
              ],
              answer: 1,
              explain: <>Capacity is monotonic in width (given the same activation). If 16 units suffice,
                256 units certainly suffice. The gap is not about what the network can represent but about
                what the optimiser finds in a larger, flatter loss landscape.</>,
            },
            {
              q: <>Which of the following is a fixed cost of a network (independent of batch size)?</>,
              options: [
                "Activation memory",
                "Parameter memory",
                "Forward-pass compute per example",
              ],
              answer: 1,
              explain: <>Parameters are stored once regardless of how many examples you process.
                Activations are stored per example (and per layer) because backpropagation needs them for
                the backward pass. Compute per example is variable by definition.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design", label: <>&#8592; Architecture design</> }}
          next={{ href: "/learn/architecture-design/parameters-and-cost", label: <>Next up &middot; Parameters, and what they cost &#8594;</> }}
        />
      </div>
    </article>
  );
}
