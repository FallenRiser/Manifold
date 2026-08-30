import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "ReLU, and what it bought — Manifold",
  description:
    "The function that unlocked depth is a single max(). Four properties explain why something that simple beat a decade of carefully designed curves — and one of them is that it is twenty times cheaper.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ReluPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The ReLU family", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 8 minutes"
        title={<>ReLU, and what it bought</>}
        intro={<>After twenty years of carefully shaped sigmoidal curves, the function that unlocked deep learning
          was <M>{String.raw`\max(0, z)`}</M>. It is worth understanding exactly what that bought, because it is not
          one thing and the list is a template for judging every activation after it.</>}
      />

      <div className="lesson">
        <h2>The function</h2>

        <MathBlock>{String.raw`\mathrm{ReLU}(z) = \max(0, z) \qquad\qquad \mathrm{ReLU}'(z) = \begin{cases}1 & z > 0\\ 0 & z < 0\end{cases}`}</MathBlock>

        <p>
          A hinge. It is not differentiable at the origin, which is worth two sentences and no more: the set{" "}
          <M>{String.raw`\{z = 0\}`}</M> has measure zero, so a randomly initialised network hits it with
          probability zero, and every framework simply defines the derivative there as 0 (PyTorch and TensorFlow
          both). This was long considered a fatal objection and turned out to be entirely irrelevant.
        </p>

        <h2>Four things it bought</h2>
        <p>
          <strong>1. A non-saturating positive half.</strong> The headline. For any positive input the derivative is
          exactly 1, so a chain of active ReLU units multiplies the gradient by{" "}
          <M>{String.raw`1 \times 1 \times \cdots \times 1 = 1`}</M>. There is no ceiling to compound against, and
          the measured twelve-layer ratio is 0.256 rather than sigmoid&rsquo;s 29 million.
        </p>
        <p>
          <strong>2. Sparsity.</strong> Roughly half the units in a randomly initialised ReLU network output exactly
          zero for a given input. That is a genuinely sparse representation — not small values, zeros — which makes
          the active subnetwork for each input smaller and, the argument goes, its features more separable. This is
          the least well-evidenced of the four benefits and is included because it is always cited; treat it as
          plausible rather than demonstrated.
        </p>
        <p>
          <strong>3. Speed.</strong> Not a footnote. A comparison, timing the activation alone on a{" "}
          <M>{String.raw`4096\times512`}</M> array:
        </p>

        <CodeOutput>{`activation   ms per call   vs relu
      relu          4.75      1.0x
     leaky         11.89      2.5x
      tanh         22.85      4.8x
   sigmoid         96.90     20.4x
       elu         38.77      8.2x
     swish        104.84     22.1x
      gelu        121.71     25.6x
      mish         82.00     17.3x`}</CodeOutput>

        <p>
          Sigmoid costs about twenty times what ReLU does, in NumPy on one machine. Those ratios shrink substantially
          on a GPU with fused kernels and they do not disappear. In 2012, when the constraint was a pair of GTX 580s,
          a twenty-fold saving on an operation applied to every unit at every step was not a detail — it was part of
          why AlexNet was trainable at all.
        </p>
        <p>
          <strong>4. Nothing to tune.</strong> No temperature, no slope, no <M>{String.raw`\alpha`}</M>. Every
          activation invented since has at least one shape parameter, and every one of those is a hyperparameter that
          could be wrong.
        </p>

        <Callout color={CORAL} title={<>The general lesson, worth more than ReLU itself</>}>
          Sigmoid and tanh were designed to model something — a neuron&rsquo;s firing rate, a smooth threshold. ReLU
          was not designed to model anything. It was chosen because <strong>its derivative has the property the
          optimiser needs</strong>, and its shape is whatever falls out of that.
          <br /><br />
          That inversion is the single most transferable idea on this track. When you reach{" "}
          <Link href="/learn/activation-functions/designing-a-new-one" style={link}>designing a new one</Link>, the
          procedure starts from the derivative you want and works backwards to a curve — because that is what
          actually worked.
        </Callout>

        <h2>What it cost</h2>
        <p>
          The negative half is exactly zero, not small. A unit whose input is negative for every training example
          receives no gradient at all and cannot recover — the failure the next page counts. And ReLU is unbounded
          above, so it offers no protection against activations growing layer over layer; that job moves to
          initialisation and normalisation.
        </p>
        <p>
          It is also, technically, not zero-centred: its outputs are non-negative, so it has exactly the sign-coupling
          property that the previous page measured at 100% for sigmoid. ReLU won anyway, which is the clearest
          available evidence about how much that property is worth.
        </p>

        <Proof color={CORAL} title="why a piecewise-linear activation is not a linear network">
          <p>
            A reasonable worry: ReLU is linear on each side of the origin, and{" "}
            <Link href="/learn/activation-functions/the-non-negotiable" style={link}>we established</Link> that
            composing linear maps gives a linear map. Why does a ReLU network not collapse?
          </p>
          <p>
            Because the composition is linear only <em>within a fixed activation pattern</em>. For a given input,
            each unit is either on or off; call that binary pattern <M>{String.raw`s`}</M>. Holding{" "}
            <M>{String.raw`s`}</M> fixed, the network is exactly an affine map{" "}
            <M>{String.raw`W_s x + b_s`}</M>. But a different input can flip units, giving a{" "}
            <em>different</em> affine map on that region.
          </p>
          <p>
            So a ReLU network is a <strong>piecewise-affine function</strong>: the input space is carved into
            polyhedral regions, each with its own linear map, glued continuously at the boundaries. The number of
            those regions grows quickly with depth, which is the precise sense in which depth buys expressiveness
            here. The network is linear everywhere locally and profoundly non-linear globally — and it is the
            boundaries between regions, the places where units switch, that do all the work.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>ReLU is non-differentiable at zero. Why does this not matter in practice?</>,
              options: [
                "Frameworks smooth the function near the origin",
                "The point has measure zero, so it is essentially never hit, and frameworks simply define the derivative there as 0",
                "Networks are initialised so that no pre-activation is ever near zero",
              ],
              answer: 1,
              explain: <>Exact floating-point zero is vanishingly unlikely, and the convention resolves the single
                ambiguous case. The objection was raised for years and proved to be about nothing.</>,
            },
            {
              q: <>Which of ReLU&rsquo;s advantages is the one that compounds with depth?</>,
              options: [
                "Its sparsity",
                "Its derivative of exactly 1 on the positive half, so a chain of active units multiplies the gradient by 1",
                "Its computational cost",
              ],
              answer: 1,
              explain: <>Speed and sparsity are per-layer benefits. The factor of exactly 1 is the one that survives
                twelve multiplications, which is why the ratio is 0.256 instead of 29 million.</>,
            },
            {
              q: <>If ReLU is linear on each side of the origin, why does a ReLU network not collapse to a single
                linear map?</>,
              options: [
                "Because the bias terms break linearity",
                "Because the affine map depends on which units are active, so the network is piecewise-affine with a different map on each region of input space",
                "Because ReLU is not really linear on the positive side",
              ],
              answer: 1,
              explain: <>Fix the on/off pattern and the network is genuinely affine. Change the input enough to flip
                a unit and you get a different affine map. The global function is a patchwork of them, and depth
                multiplies the number of pieces.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/what-depth-did", label: <>← What depth did to both</> }}
          next={{ href: "/learn/activation-functions/dying-relu", label: <>Next up · Dying ReLU →</> }}
        />
      </div>
    </article>
  );
}
