import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Composition and feature hierarchy — Manifold",
  description:
    "The mathematical view of depth: a chain of composed functions that can represent some targets exponentially more efficiently than a single wide layer. When the hierarchy exists, depth wins. When it does not, depth is wasted.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function CompositionAndHierarchyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Depth", color: CORAL }, { label: "Tier 1 · theory", color: CORAL }]}
        time="about 10 minutes"
        title={<>Composition and feature hierarchy</>}
        intro={<>The previous page said that depth lets a network reuse its own computations. This page
          makes that claim precise: the function a deep network computes is a <strong>chain of
          compositions</strong>, and for certain function families that chain is exponentially more
          efficient than a single wide layer. Whether your problem sits in that family is a
          measurable question, not a matter of faith.</>}
      />

      <div className="lesson">
        <h2>The chain of compositions</h2>
        <p>
          A feedforward network of depth <M>{String.raw`D`}</M> computes a function by applying{" "}
          <M>{String.raw`D`}</M> transformations in sequence. Write each layer as an affine map
          followed by a non-linearity:{" "}
          <M>{String.raw`f_i(\mathbf{h}) = \sigma(W_i \mathbf{h} + b_i)`}</M>. The network&rsquo;s
          output is the composition:
        </p>

        <MathBlock>{String.raw`\hat{y} = g\!\bigl(\,f_D \circ f_{D-1} \circ \cdots \circ f_1(\mathbf{x})\,\bigr)`}</MathBlock>

        <p>
          where <M>{String.raw`g`}</M> is whatever read-out the final layer applies (a sigmoid for
          binary classification, a softmax for multi-class, identity for regression). The key structural
          constraint is that each <M>{String.raw`f_i`}</M> can only see the output of{" "}
          <M>{String.raw`f_{i-1}`}</M>. It has no direct access to the raw input{" "}
          <M>{String.raw`\mathbf{x}`}</M>, no direct access to the outputs of layers before{" "}
          <M>{String.raw`i{-}1`}</M>, and no side channel. Everything it knows about the world arrives
          through a bottleneck: the representation that the previous layer chose to pass forward.
        </p>
        <p>
          This constraint is what makes depth meaningful. If every layer could see the raw input
          directly, adding layers would be equivalent to adding width — more independent features all
          computed from <M>{String.raw`\mathbf{x}`}</M>. Because each layer sees only its
          predecessor&rsquo;s output, it is forced to build on what came before. The result is a
          hierarchy: layer 1 produces first-order features, layer 2 produces second-order features
          (features of features), layer 3 produces third-order features, and so on.
        </p>

        <h2>The exponential separation</h2>
        <p>
          Not all functions benefit equally from this hierarchy. Some functions have a natural
          compositional structure that a deep network can exploit; others do not. The theoretical
          computer science literature provides sharp examples of the separation.
        </p>

        <Callout color={CORAL} title={<>The parity function</>}>
          Consider the parity of <M>{String.raw`n`}</M> binary inputs: the output is 1 if the sum
          of the inputs is odd, 0 otherwise. A depth-<M>{String.raw`n`}</M> network of width 2 can
          compute this by XOR-ing inputs one at a time — each layer combines one new input with the
          running parity. A depth-1 network, however, needs{" "}
          <M>{String.raw`2^n`}</M> hidden units to represent parity, because every possible input
          combination must be handled independently. The depth-<M>{String.raw`n`}</M> network
          uses <M>{String.raw`O(n)`}</M> parameters; the depth-1 network
          uses <M>{String.raw`O(2^n)`}</M>. That is an exponential gap.
        </Callout>

        <p>
          Parity is a toy example, but the pattern it illustrates is general. Any target function
          that can be decomposed as a nested sequence of simple operations — where later operations
          depend on earlier ones — is a candidate for exponential depth efficiency. The XOR cascade
          makes this concrete: define{" "}
          <M>{String.raw`g_1 = x_1 \oplus x_2`}</M>,{" "}
          <M>{String.raw`g_2 = g_1 \oplus x_3`}</M>,{" "}
          <M>{String.raw`g_3 = g_2 \oplus x_4`}</M>, and so on. Each step depends on the
          previous step&rsquo;s output, so a deep network that computes one step per layer is
          natural. A wide network that tries to compute the whole thing in one shot must
          enumerate all <M>{String.raw`2^n`}</M> input patterns.
        </p>

        <MathBlock>{String.raw`\underbrace{x_1 \oplus x_2}_{\text{layer 1}} \;\to\; \underbrace{(\cdot) \oplus x_3}_{\text{layer 2}} \;\to\; \underbrace{(\cdot) \oplus x_4}_{\text{layer 3}} \;\to\; \cdots`}</MathBlock>

        <h2>Where the hierarchy exists</h2>
        <p>
          The exponential separation theorem tells you that <em>some</em> functions need depth.
          It does not tell you that <em>your</em> function does. Whether your problem has a natural
          feature hierarchy is an empirical question, and the depth sweep from the previous page
          is the experiment that answers it.
        </p>
        <p>
          Problems with rich, multi-level structure benefit enormously from depth. Images have
          pixels, edges, textures, parts, objects, scenes — at least five or six levels of
          abstraction. Natural language has characters, morphemes, words, phrases, clauses,
          sentences, paragraphs, documents — even more levels. Audio has samples, phonemes,
          syllables, words, utterances. In each domain, the state of the art uses deep
          architectures (50+ layers for images, 100+ layers for language) because the data
          itself is hierarchically structured.
        </p>
        <p>
          Tabular data is different. A row in a spreadsheet typically has 10-100 features,
          each already meaningful (age, income, transaction count). There is no pixel-to-object
          progression because the features are already at the semantic level. A depth-2 network
          can combine pairs of features into interaction terms; a depth-3 network can combine
          interactions. Beyond that, the problem usually has no further hierarchy to exploit, and
          depth becomes overhead.
        </p>

        <h2>The honest finding on moons</h2>
        <p>
          Moons is a 2D classification problem with a single curved boundary. Its feature hierarchy
          is one level deep: warp the two raw coordinates so the crescents separate, then draw a
          line. A depth-2 network (one hidden layer to warp, one to classify) achieves{" "}
          <strong>0.953</strong> test accuracy at width 32. Adding layers 3 through 8 cannot improve
          on this because there is no second-order structure to compose. The depth-8 network scores{" "}
          <strong>0.936</strong> — worse, not better.
        </p>
        <p>
          This is exactly what the theory predicts. The exponential separation applies to functions
          with deep compositional structure. Moons does not have deep compositional structure, so
          depth beyond 2 adds parameters and optimisation difficulty without adding representational
          power. The depth sweep confirms the theory rather than contradicting it.
        </p>

        <Proof color={CORAL} title="why universal approximation does not settle this">
          <p>
            The{" "}
            <Link href="/learn/perceptron-to-mlp/universal-approximation" style={link}>
              universal approximation theorem
            </Link>{" "}
            guarantees that a depth-1 network with enough width can approximate any continuous
            function to any desired accuracy. This is true and completely irrelevant to practice.
          </p>
          <p>
            The theorem is an <em>existence</em> result: it says the approximation exists in the
            space of representable functions. It says nothing about how many parameters are
            needed (it may be exponentially many), whether gradient descent can find them (it may
            not converge), or how well the result generalises from finite training data (it may
            memorise everything). A depth-1 network that needs{" "}
            <M>{String.raw`2^{100}`}</M> hidden units to represent parity on 100 bits is
            technically a universal approximator. It is also useless.
          </p>
          <p>
            Depth is about <em>efficiency</em> and <em>trainability</em>, not about what is
            theoretically possible. The question is never &ldquo;can a shallow network represent
            this?&rdquo; — the answer is always yes. The question is &ldquo;can a shallow network
            learn this from a realistic amount of data with a realistic optimiser in a realistic
            amount of time?&rdquo; And the answer to that question depends on whether the target
            function has structure that depth can exploit.
          </p>
        </Proof>

        <h2>The composition test</h2>
        <p>
          Before adding depth, ask: does this problem have a natural decomposition into levels?
          Can you imagine features-of-features that are meaningfully different from the raw
          features? If the input is an image, the answer is obviously yes — you can literally
          see the edges, corners, and shapes. If the input is a table of already-semantic columns,
          the answer is usually no beyond one or two levels of interaction.
        </p>
        <p>
          This is not a formal test. The formal test is the depth sweep: train the same problem
          at depth 1, 2, 3, 4, 6, 8, holding width constant, and measure test accuracy. If the
          curve peaks at depth 2 and declines, the problem is shallow. If it keeps climbing, the
          problem has hierarchy worth exploiting. On moons at width 32, the curve peaks at{" "}
          <strong>depth 2</strong> and every additional layer degrades performance. The problem
          told us its answer.
        </p>

        <Callout color={CORAL} title={<>Depth is earned, not assumed</>}>
          Modern deep-learning success stories (ResNets, transformers, U-Nets) all operate on
          problems with rich hierarchical structure. The depth is earned by the data, not imposed
          by fashion. A 50-layer ResNet on ImageNet exploits 50 levels of visual abstraction. A
          50-layer MLP on a tabular credit-scoring dataset does not exploit 50 levels of anything —
          it just makes optimisation harder. Match the architecture to the structure of the problem.
        </Callout>

        <h2>What happens when you add depth anyway</h2>
        <p>
          If the problem does not support the depth, three things go wrong. First, the extra
          layers have nothing useful to learn, so their weights stay near their initialisation
          and the layer acts approximately as an identity — a pass-through that costs parameters
          but adds no function. Second, the loss landscape becomes rougher: more saddle points,
          more local minima, slower convergence. Third, the gradient product acquires more factors,
          and even with well-behaved activations like ReLU the variance of the product grows,
          making optimisation noisier.
        </p>
        <p>
          The depth-8 result (0.936 vs. 0.953 at depth 2) shows all three effects at work. The
          extra layers are not helping — the problem is too shallow — but they are hurting, because
          the optimiser has to navigate a harder landscape with a noisier gradient signal. The next
          page puts precise numbers on each of these costs.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why does each layer in a feedforward network build &ldquo;features of features&rdquo;
                rather than additional features of the raw input?</>,
              options: [
                "Because each layer receives only the previous layer's output, not the raw input, so it is forced to build on that representation",
                "Because the weights are shared across layers, so each layer sees the same input differently",
                "Because the non-linearity erases the raw input, making it inaccessible",
              ],
              answer: 0,
              explain: <>In a standard feedforward architecture, layer <M>{String.raw`k`}</M> receives{" "}
                <M>{String.raw`\mathbf{h}_{k-1}`}</M> as its only input. It has no skip connection
                to <M>{String.raw`\mathbf{x}`}</M> and no weight sharing with other layers. This
                information bottleneck is what forces composition: each layer must build on what the
                previous layer produced.</>,
            },
            {
              q: <>The parity function on <M>{String.raw`n`}</M> bits can be computed by a depth-<M>{String.raw`n`}</M>{" "}
                network of width 2 but requires <M>{String.raw`2^n`}</M> hidden units at depth 1.
                What property of parity creates this exponential gap?</>,
              options: [
                "Parity is non-differentiable, so shallow networks cannot approximate it",
                "Parity has a sequential compositional structure (each XOR depends on the previous one) that depth exploits directly",
                "Parity requires more precision than shallow networks can achieve",
              ],
              answer: 1,
              explain: <>Parity decomposes naturally as a chain of XOR operations, each depending on
                the result of the previous one. A deep network computes one XOR per layer, using{" "}
                <M>{String.raw`O(n)`}</M> parameters total. A depth-1 network has no way to
                chain operations and must enumerate all <M>{String.raw`2^n`}</M> input patterns
                independently.</>,
            },
            {
              q: <>On a tabular dataset with 50 already-meaningful features (age, income, etc.),
                how many hidden layers are typically needed before depth stops helping?</>,
              options: [
                "At least 10 — deep learning always benefits from depth",
                "Exactly 1 — the universal approximation theorem guarantees sufficiency",
                "Usually 2 or 3 — the features are already semantic, so there is little hierarchy beyond simple interactions",
              ],
              answer: 2,
              explain: <>Tabular features are already at a meaningful level of abstraction. A depth-2
                network can learn pairwise interactions; depth-3 can learn interactions of
                interactions. Beyond that, tabular data rarely has further compositional structure,
                and added depth increases optimisation difficulty without increasing representational
                power. This is consistent with the moons result, where depth 2 was optimal.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/what-depth-buys", label: <>&#8592; What depth buys</> }}
          next={{ href: "/learn/architecture-design/the-depth-tax", label: <>Next up &middot; The depth tax &#8594;</> }}
        />
      </div>
    </article>
  );
}
