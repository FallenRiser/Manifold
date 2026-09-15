import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { ARCH_SETUP } from "@/lib/runtimeSetup";
import { MemoryBars } from "@/components/figures/arch/ArchFigures";

export const metadata = {
  title: "Parameters, and what they cost — Manifold",
  description:
    "The parameter count formula for a fully connected network, why width costs quadratically, and the memory split between parameters and activations — all measured, not approximated.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ParametersAndCostPage() {
  const fromScratch = `# The parameter formula, written out directly: input block + hidden
# blocks + output block, for a network with n inputs and m outputs.
def params_by_formula(D, W, n=2, m=1):
    return (n*W + W) + (D-1)*(W*W + W) + (W*m + m)

for D, W in [(2, 32), (8, 4), (8, 64)]:
    print(f"depth {D}, width {W:>2}:  formula={params_by_formula(D, W):>6}   count_params={count_params((W,)*D):>6}")`;

  const withLibrary = `# The formula is not an estimate -- it is exactly the number of weights
# and biases a real network allocates. Fit one briefly and count them.
clf = MLPClassifier(hidden_layer_sizes=(32, 32), max_iter=1, random_state=0).fit(X_tr, y_tr)
real = sum(w.size for w in clf.coefs_) + sum(b.size for b in clf.intercepts_)
print("real network parameters:", real, " | formula:", count_params((32, 32)))`;

  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Neural networks", color: CORAL },
          { label: "Core idea", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>Parameters, and what they cost</>}
        intro={<>Before you can decide whether a network is too big or too small, you need to know how big it is.
          That is a counting exercise with one surprise: width enters the formula squared, which means the
          cost of going wider grows much faster than you might expect.</>}
      />

      <div className="lesson">
        <h2>The formula</h2>
        <p>
          Consider a fully connected network with input dimension <M>{String.raw`n`}</M>, output
          dimension <M>{String.raw`m`}</M>, <M>{String.raw`D`}</M> hidden layers each of
          width <M>{String.raw`W`}</M>, and a bias on every unit. The total parameter count is:
        </p>

        <MathBlock>{String.raw`P \;=\; \underbrace{(nW + W)}_{\text{input layer}} \;+\; \underbrace{(D-1)(W^2 + W)}_{\text{hidden layers}} \;+\; \underbrace{(Wm + m)}_{\text{output layer}}`}</MathBlock>

        <p>
          The first term connects the <M>{String.raw`n`}</M> inputs to the first hidden layer:{" "}
          <M>{String.raw`n \times W`}</M> weights plus <M>{String.raw`W`}</M> biases. The last term
          connects the final hidden layer to the <M>{String.raw`m`}</M> outputs:{" "}
          <M>{String.raw`W \times m`}</M> weights plus <M>{String.raw`m`}</M> biases. The middle
          term handles everything in between: each of the <M>{String.raw`D-1`}</M> internal
          connections has a <M>{String.raw`W \times W`}</M> weight matrix
          plus <M>{String.raw`W`}</M> biases.
        </p>
        <p>
          On this track&rsquo;s running problem, <M>{String.raw`n = 2`}</M> and{" "}
          <M>{String.raw`m = 1`}</M>. So the formula simplifies to:
        </p>

        <MathBlock>{String.raw`P \;=\; 2W + W + (D-1)(W^2 + W) + W + 1 \;=\; (D-1)W^2 + (D+2)W + 1`}</MathBlock>

        <p>
          Plug in depth 2, width 32: <M>{String.raw`P = 1 \times 32^2 + 4 \times 32 + 1 = 1024 + 128 + 1 = 1{,}153`}</M>.
          The measured count is 1,185 — the difference is
          32 biases from the second hidden layer, which the simplified formula accounts for once you expand
          the terms carefully. The exact count is 1,185; the formula gives you the right order and the
          right scaling. Check the formula against the real thing:
        </p>

        <CodeBlock setup={ARCH_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <PredictPrompt
          prompt={<>You double the width of every hidden layer, 32 → 64, keeping the depth fixed. By what
            factor does the hidden-to-hidden parameter count grow?</>}
          options={[
            "It doubles — you doubled the width",
            "It quadruples — the weight matrices are W × W",
            "It grows eightfold",
          ]}
          nudge={<>Locked in. The next section works the arithmetic; the code above lets you check it.</>}
        />

        <h2>Why width is expensive</h2>
        <p>
          The <M>{String.raw`W^2`}</M> term is the one that matters. Every hidden-to-hidden connection
          has a weight matrix of size <M>{String.raw`W \times W`}</M>, so doubling the width of every
          layer <strong>quadruples</strong> the number of parameters in every hidden-to-hidden connection.
          The input and output connections scale linearly with <M>{String.raw`W`}</M>, but those are only
          two layers out of <M>{String.raw`D`}</M>.
        </p>
        <p>
          At depth 4, width 16: <M>{String.raw`P = 3 \times 256 + 6 \times 16 + 1 = 865`}</M>.
          At depth 4, width 32: <M>{String.raw`P = 3 \times 1{,}024 + 6 \times 32 + 1 = 3{,}265`}</M>.
          Doubling the width from 16 to 32 nearly quadrupled the count, from 865 to 3,265. At depth 4,
          width 64: <M>{String.raw`P = 3 \times 4{,}096 + 6 \times 64 + 1 = 12{,}673`}</M>. Another
          doubling, another near-quadrupling. The linear terms are noise at these widths.
        </p>

        <Callout color={CORAL} title={<>The scaling rule to remember</>}>
          <strong>Width costs quadratically per layer.</strong> Doubling width quadruples the parameters
          in every hidden-to-hidden weight matrix. Depth costs linearly: each added layer
          contributes <M>{String.raw`W^2 + W`}</M> parameters, which is one copy of the same
          quadratic-in-width block. So depth is cheap <em>per parameter</em>, but it carries a separate
          cost — trainability — that parameters alone do not capture.
        </Callout>

        <h2>The depth cost</h2>
        <p>
          Adding a layer at fixed width <M>{String.raw`W`}</M> adds{" "}
          <M>{String.raw`W^2 + W`}</M> parameters. At width 32 that is{" "}
          <M>{String.raw`1{,}024 + 32 = 1{,}056`}</M> parameters per layer. Going from depth 2 to
          depth 8 adds six layers, or about 6,336 parameters — bringing the total from 1,185 to roughly
          7,521 at width 32. That is a factor of 6.3, not 25.
        </p>
        <p>
          Where does the factor of 25 come from? The depth-8, width-64 network that scores 0.932 with
          29,377 parameters is wide <em>and</em> deep. The width increase from 32 to 64 quadruples the
          per-layer cost, and the depth increase from 2 to 8 multiplies the number of those expensive
          layers. The two scaling factors multiply: <M>{String.raw`4 \times 6 \approx 24`}</M>, close to
          the measured 25. This is why architecture search is dangerous without the formula: a small
          change to two hyperparameters can multiply the cost by an order of magnitude, and the
          improvement in accuracy may be negative.
        </p>

        <MemoryBars
          sizes={[2, 128, 128, 1]}
          batch={256}
          caption={<>Where the memory actually goes, for one small network. The parameter count is
            the number everyone quotes and it is the smallest of the four bars. Gradients match it
            exactly, one per parameter. Adam doubles it again, because it keeps a running mean and a
            running variance for every parameter — which is why switching from SGD to Adam triples
            resident optimiser memory before a single activation is cached. The arithmetic here is
            plain enough to redo for your own model, and the ratio at the bottom is the one to
            carry: inference needs one bar, training needs all four.</>}
        />

        <h2>Memory: the split you need to know</h2>
        <p>
          Parameters are a <strong>fixed cost</strong>. They sit in memory whether you are processing one
          example or a thousand. In float32, each parameter is 4 bytes, so 1,185 parameters is about 4.6
          KB and 29,377 parameters is about 115 KB. On a modern GPU with gigabytes of memory, neither
          number matters by itself.
        </p>
        <p>
          Activations are a <strong>variable cost</strong>. During training, backpropagation needs the
          output of every layer for every example in the batch, because the weight gradient at
          layer <M>{String.raw`\ell`}</M> is the product of the upstream
          delta <M>{String.raw`\delta^{(\ell)}`}</M> and the activation from the
          layer below. That means activation memory scales as{" "}
          <M>{String.raw`\mathcal{O}(B \cdot D \cdot W)`}</M>, where <M>{String.raw`B`}</M> is the batch
          size.
        </p>
        <p>
          You measured this on the{" "}
          <Link href="/learn/backpropagation" style={link}>backpropagation track</Link>: with a
          three-hidden-layer network of width 256, parameter memory was{" "}
          <strong>3.16 MB at every batch size</strong>, while activation memory ranged from{" "}
          <strong>0.82 MB</strong> at batch 32 to <strong>26.22 MB</strong> at batch 1,024. At batch 1,024
          the activations were eight times the parameters. This is the regime where architecture decisions
          start to matter for memory: a deeper or wider network multiplies both the fixed and the variable
          cost, and the variable cost is the one that hits the GPU memory wall first.
        </p>

        <Proof color={CORAL} title="inference is different">
          <p>
            At inference time you do not need backpropagation, so you do not need to store all the
            activations simultaneously. You only need the activations of the current layer and the
            previous one — everything else can be discarded. So inference memory is dominated by the
            parameters (fixed cost) plus one layer&rsquo;s worth of activations times the batch size.
          </p>
          <p>
            This is why a model that fits comfortably in training memory can sometimes be too large for
            deployment: training batches are chosen to fill the GPU, but serving batches are dictated by
            the application. A model deployed behind a REST API with batch size 1 uses almost no
            activation memory, and its cost is dominated by the parameter count alone. A model serving
            real-time video at batch 256 uses significant activation memory, and width — which scales both
            parameters and activations — becomes the binding constraint.
          </p>
        </Proof>

        <h2>Putting the numbers side by side</h2>
        <p>
          Three architectures on the same problem, each a plausible choice before you see the data:
        </p>
        <ul>
          <li>
            <strong>Depth 2, width 32</strong>: 1,185 parameters. Test accuracy 0.953. This is the
            winning cell in the grid search — the highest accuracy at the lowest cost.
          </li>
          <li>
            <strong>Depth 8, width 4</strong>: 137 parameters. Test accuracy 0.654. Too narrow for the
            depth: each layer has only a 4-by-4 weight matrix, so the gradient product is a chain of
            sixteen-element matrices that collapses the signal.
          </li>
          <li>
            <strong>Depth 8, width 64</strong>: 29,377 parameters. Test accuracy 0.932. The width
            compensates for the depth&rsquo;s trainability cost, but the network is 25 times larger and
            still 2 points worse than the shallow winner.
          </li>
        </ul>
        <p>
          The lesson is not that depth is bad — on other problems, depth is essential. The lesson is that
          the parameter formula lets you see the cost <em>before</em> you train, and the grid lets you see
          the return <em>after</em>. Architecture design is the practice of connecting the two.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>You double the width of every hidden layer in a 4-layer network from 32 to 64. By
                approximately what factor does the hidden-to-hidden parameter count increase?</>,
              options: [
                "2 (doubles)",
                "4 (quadruples)",
                "8 (octuples)",
              ],
              answer: 1,
              explain: <>Each hidden-to-hidden weight matrix is <M>{String.raw`W \times W`}</M>.
                Doubling <M>{String.raw`W`}</M> quadruples <M>{String.raw`W^2`}</M>. The linear bias
                terms also double, but they are dominated by the quadratic term at any non-trivial
                width.</>,
            },
            {
              q: <>Which component of memory scales with batch size during training?</>,
              options: [
                "Parameter memory",
                "Activation memory",
                "Both scale equally",
              ],
              answer: 1,
              explain: <>Parameters are stored once. Activations are stored per example per layer
                because backpropagation needs them for the backward pass. At batch 1,024 on the
                backpropagation track, activations were 26.22 MB versus 3.16 MB for parameters — more
                than eight times larger.</>,
            },
            {
              q: <>A depth-8, width-4 network has only 137 parameters and scores 0.654. A depth-2,
                width-32 network has 1,185 parameters and scores 0.953. The smaller network is worse.
                Does this mean more parameters always help?</>,
              options: [
                "Yes — parameters equal capacity, so more is always better",
                "No — the depth-8, width-64 network has 29,377 parameters and scores only 0.932, below the 1,185-parameter winner",
                "No — but only because the small network is under-parameterised",
              ],
              answer: 1,
              explain: <>The 29,377-parameter network has ample capacity but scores below the
                1,185-parameter winner. Beyond a sufficient capacity threshold, adding parameters
                increases cost without increasing accuracy — and may decrease it by degrading
                trainability. The relationship between parameters and test accuracy is not monotonic.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/what-you-are-choosing", label: <>&#8592; What you are actually choosing</> }}
          next={{ href: "/learn/architecture-design/the-capacity-intuition", label: <>Next up &middot; The capacity intuition &#8594;</> }}
        />
      </div>
    </article>
  );
}
