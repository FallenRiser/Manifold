import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "What depth buys — Manifold",
  description:
    "Depth is composition: each layer builds features from the previous layer's features. On moons, the jump from depth 1 to 2 is the biggest gain. Beyond that, the story depends on the problem.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatDepthBuysPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Depth", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 9 minutes"
        title={<>What depth buys</>}
        intro={<>Width gives you capacity. Depth gives you something different: the ability to{" "}
          <strong>compose</strong>. Each layer can build features from the previous layer&rsquo;s features,
          so a depth-4 network can represent functions that a depth-1 network cannot express without
          exponentially more width. Whether that matters depends entirely on the problem.</>}
      />

      <div className="lesson">
        <h2>The one-sentence answer</h2>
        <p>
          Depth lets a network <strong>reuse its own computations</strong>. A single hidden layer
          transforms the raw input into a set of learned features. A second hidden layer transforms
          those features into higher-level features. A third layer transforms <em>those</em>. At each
          stage the network is building on what it has already computed rather than starting from the
          original coordinates, and that is an entirely different kind of power from having more units
          in a single row.
        </p>
        <p>
          This is easiest to see in the domain where it matters most. In a convolutional network trained
          on images, the first layer learns oriented edges — small filters that respond to vertical,
          horizontal, and diagonal contrasts. The second layer combines those edges into corners and
          junctions. The third layer combines corners into texture patches and partial contours. By layer
          five or six the network has assembled eyes, wheels, letters — semantic parts built entirely
          from the simple edge detectors it learned at the bottom.
        </p>
        <p>
          None of that is metaphor. The feature hierarchy is directly measurable: you can read off the
          activation of any intermediate layer, visualise what triggers it, and confirm that layer{" "}
          <M>{String.raw`k`}</M> responds to more abstract patterns than layer{" "}
          <M>{String.raw`k-1`}</M>. The same principle drives transformers in language: early
          attention heads learn local syntactic patterns, later heads learn long-range semantic
          relationships. Depth is how the model moves from tokens to meaning.
        </p>

        <h2>Composition, precisely</h2>
        <p>
          A depth-<M>{String.raw`D`}</M> network with layers{" "}
          <M>{String.raw`f_1, f_2, \ldots, f_D`}</M> computes the composition{" "}
          <M>{String.raw`f_D \circ f_{D-1} \circ \cdots \circ f_1(\mathbf{x})`}</M>. Each layer{" "}
          <M>{String.raw`f_i`}</M> is an affine transformation followed by a non-linearity, so the
          overall function is a nested chain of simple mappings. Crucially, each{" "}
          <M>{String.raw`f_i`}</M> operates not on the raw input{" "}
          <M>{String.raw`\mathbf{x}`}</M> but on the <em>output</em> of{" "}
          <M>{String.raw`f_{i-1}`}</M> — the representation the previous layer chose to pass forward.
        </p>

        <MathBlock>{String.raw`\hat{y} = f_D\!\bigl(\,f_{D-1}\!\bigl(\,\cdots\,f_2\!\bigl(\,f_1(\mathbf{x})\,\bigr)\,\cdots\,\bigr)\,\bigr)`}</MathBlock>

        <p>
          A depth-1 network (a single hidden layer) maps the input to one intermediate
          representation and then to the output. If that one representation is insufficient — if the
          decision boundary has structure that requires features-of-features — the only remedy at
          depth 1 is to add more width. A depth-2 network can sometimes achieve the same boundary
          with far fewer total parameters, because the second layer can combine the first
          layer&rsquo;s outputs rather than inventing everything from raw coordinates.
        </p>

        <h2>The measured gain on moons</h2>
        <p>
          On the running problem in this track (sklearn moons, <M>{String.raw`n = 800`}</M>,
          noise 0.25), the depth sweep at fixed width 32 gives:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>depth</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test accuracy</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>change from depth 1</th>
              </tr>
            </thead>
            <tbody>
              {([
                { d: 1, acc: "0.918", delta: "---" },
                { d: 2, acc: "0.953", delta: "+0.035" },
                { d: 3, acc: "0.944", delta: "+0.026" },
                { d: 4, acc: "0.945", delta: "+0.027" },
                { d: 6, acc: "0.944", delta: "+0.026" },
                { d: 8, acc: "0.936", delta: "+0.018" },
              ] as const).map((r) => (
                <tr key={r.d}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.d}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.acc === "0.953" ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.acc}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.delta.startsWith("+0.035") ? "var(--good)" : "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Width fixed at 32, ReLU activations, He initialisation.
        </p>

        <p>
          The biggest single jump is from depth 1 to depth 2: a gain of <strong>0.035</strong> in test
          accuracy. Depth 2 is the best overall at 0.953. Going deeper than 2 never recovers that peak —
          depth 3 drops to 0.944, depth 4 to 0.945, depth 8 to 0.936. By the time the network has eight
          layers, it has <strong>lost 0.017</strong> relative to the two-layer optimum.
        </p>

        <Callout color={CORAL} title={<>Do not generalise this finding</>}>
          The fact that depth beyond 2 hurts here is a property of <strong>this problem</strong>, not
          of depth itself. Moons is a two-dimensional, single-boundary classification task. There is no
          natural feature hierarchy — no edges-to-corners-to-shapes progression. A single hidden layer
          can learn the crescent boundary; a second layer refines it; a third layer has nothing left to
          compose and instead adds optimisation difficulty. On a problem with genuine hierarchy — images,
          audio, language — the crossover can happen at depth 50 or 150, not at depth 2.
        </Callout>

        <h2>Why the first hidden layer does most of the work</h2>
        <p>
          On a problem like moons, the first hidden layer does the heavy lifting: it warps
          two-dimensional space so that the two crescents become linearly separable. The second layer
          then draws a hyperplane through the warped space and classifies correctly. That second
          layer is worth +0.035 because a linear boundary in a well-warped space is more accurate
          than a direct linear boundary in the original space.
        </p>
        <p>
          But a third layer would need to improve on a space that is <em>already</em> well-separated.
          There is nothing for it to compose that the second layer has not already handled. So its
          contribution is nil, and its cost — extra parameters, extra gradient factors, a rougher
          loss surface — is positive. The network is deeper but no more capable, and the extra
          depth makes it harder to train.
        </p>

        <h2>Where depth is transformative</h2>
        <p>
          The pattern changes completely on problems with natural hierarchy. Consider a classification
          task on 32x32 colour images. The input is a 3,072-dimensional vector with no obvious
          structure. A depth-1 network would need to discover every useful pattern — edges, corners,
          textures, parts, objects — from a single linear transformation followed by a non-linearity.
          The number of units required is enormous, and the resulting function is fragile because
          every pattern is encoded independently.
        </p>
        <p>
          A depth-6 network, by contrast, can discover edges in layer 1, assemble them into corners
          in layer 2, combine corners into textures in layer 3, and so on. Each layer has a manageable
          job, and the overall function is built by composition rather than by brute enumeration. This
          is why modern vision architectures are often 50 or 100 layers deep: each additional layer
          adds a level of abstraction, and the problem has dozens of natural levels.
        </p>

        <Proof color={CORAL} title="the exponential separation theorem, informally">
          <p>
            There exist families of functions that a depth-<M>{String.raw`D`}</M> network of
            width <M>{String.raw`W`}</M> can represent, but a depth-1 network would need width{" "}
            <M>{String.raw`\Omega(2^W)`}</M> to represent. The canonical example is the parity
            function on <M>{String.raw`n`}</M> bits: a depth-<M>{String.raw`n`}</M> network of
            width 2 computes it, but a depth-1 network needs <M>{String.raw`2^n`}</M> hidden
            units.
          </p>
          <p>
            This does not mean that every function benefits from depth. It means there is a{" "}
            <em>class</em> of functions — those with compositional structure — for which depth
            is exponentially more efficient than width. Whether your particular function is in
            that class depends on your data, and the depth sweep tells you.
          </p>
        </Proof>

        <h2>The operational lesson</h2>
        <p>
          Depth is worth trying, but only up to the point where the problem&rsquo;s own structure
          is exhausted. On tabular problems with a handful of raw features and no natural hierarchy,
          depth 2 or 3 is almost always sufficient. Going deeper adds parameters, slows convergence,
          and introduces gradient pathologies without buying additional representational power. On
          structured problems (images, sequences, graphs), depth is essential because the structure
          itself is hierarchical.
        </p>
        <p>
          The depth sweep is the diagnostic. If test accuracy stops improving — or starts declining —
          as you add layers, the problem has told you its answer. On moons, that answer is{" "}
          <strong>2</strong>. On ImageNet, the answer is closer to 150. The number is not
          architecture folklore; it is a measurable property of the task.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>On the moons dataset at width 32, depth 2 scores 0.953 and depth 8 scores 0.936.
                Why does quadrupling the depth make the model worse?</>,
              options: [
                "The deeper model overfits because it has more parameters",
                "The problem has no feature hierarchy for the extra layers to exploit, so they add optimisation cost without representational benefit",
                "Depth 8 has vanishing gradients that prevent any learning",
              ],
              answer: 1,
              explain: <>Moons is a 2D problem with a single curved boundary. A two-layer network
                can warp the space and draw the boundary; layers 3 through 8 have nothing new to
                compose and instead make the loss surface harder to navigate. The gradient ratios
                at depth 8 with He+ReLU are still reasonable (around 2.5), so vanishing gradients
                are not the primary cause.</>,
            },
            {
              q: <>What does &ldquo;composition&rdquo; mean in the context of a multi-layer network?</>,
              options: [
                "Each layer averages the raw input with the output of the previous layer",
                "Each layer operates on the previous layer's output, building features from features rather than from raw inputs",
                "Each layer independently processes the raw input, and the results are summed at the end",
              ],
              answer: 1,
              explain: <>In a feedforward network, layer <M>{String.raw`k`}</M> receives only the
                output of layer <M>{String.raw`k{-}1`}</M>. It cannot see the raw input directly.
                This means it is building new features from the features the previous layer chose to
                pass forward — composition, not independent processing.</>,
            },
            {
              q: <>A depth-1 network and a depth-6 network are both trained on an image classification
                task. Which is more likely to benefit from the extra depth, and why?</>,
              options: [
                "The depth-1 network, because extra depth always improves a shallow model",
                "Neither — the universal approximation theorem says depth 1 is sufficient",
                "The depth-6 network, because images have a natural feature hierarchy (edges, corners, textures, parts) that depth can exploit compositionally",
              ],
              answer: 2,
              explain: <>Universal approximation guarantees existence but not trainability or
                efficiency. A depth-1 network can theoretically represent any continuous function, but
                it may need exponentially more width than a deeper network on a problem with
                compositional structure. Images have exactly that structure — dozens of levels of
                abstraction from pixels to objects — so depth is transformative there.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/when-to-go-wider", label: <>&#8592; When to go wider</> }}
          next={{ href: "/learn/architecture-design/composition-and-hierarchy", label: <>Next up &middot; Composition and feature hierarchy &#8594;</> }}
        />
      </div>
    </article>
  );
}
