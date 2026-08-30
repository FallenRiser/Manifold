import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "A layer is a matrix multiply — Manifold",
  description:
    "The circles-and-arrows diagram is a picture of a matrix multiplication. Once you see which part of the matrix is which, the whole forward pass is four lines of arithmetic.",
};

const CORAL = "var(--c-neural)";

// The same layer drawn twice: as a graph, and as the matrix the graph is a
// picture of. Literal coordinates; no hydration surface.
function LayerAsMatrixFigure() {
  const W = 540, H = 210;
  const inY = [58, 106, 154];
  const outY = [70, 130];
  const inX = 46, outX = 168;

  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label="Three input nodes fully connected to two output nodes, beside a 3 by 2 matrix whose entries are the six connection weights"
      >
        {/* the graph */}
        {inY.map((y1, i) =>
          outY.map((y2, j) => (
            <line
              key={`${i}-${j}`} x1={inX + 15} y1={y1} x2={outX - 15} y2={y2}
              stroke={CORAL} strokeWidth={1.1} opacity={0.45}
            />
          )),
        )}
        {inY.map((y, i) => (
          <g key={`i${i}`}>
            <circle cx={inX} cy={y} r={15} fill="var(--surface)" stroke="var(--border-strong)" />
            <text x={inX} y={y + 4} fontSize={11} fill="var(--ink)" textAnchor="middle">x{"₁₂₃"[i]}</text>
          </g>
        ))}
        {outY.map((y, j) => (
          <g key={`o${j}`}>
            <circle cx={outX} cy={y} r={15} fill="var(--surface)" stroke={CORAL} strokeWidth={1.5} />
            <text x={outX} y={y + 4} fontSize={11} fill="var(--ink)" textAnchor="middle">h{"₁₂"[j]}</text>
          </g>
        ))}
        <text x={107} y={192} fontSize={10.5} fill="var(--muted)" textAnchor="middle">6 connections</text>

        <text x={228} y={110} fontSize={17} fill="var(--faint)" textAnchor="middle">=</text>

        {/* the matrix */}
        <g>
          <text x={272} y={60} fontSize={11} fill="var(--muted)">W₁ =</text>
          {[0, 1, 2].map((i) =>
            [0, 1].map((j) => (
              <g key={`m${i}-${j}`}>
                <rect
                  x={318 + j * 54} y={72 + i * 34} width={48} height={28} rx={5}
                  fill={`color-mix(in srgb, ${CORAL} 10%, var(--surface))`}
                  stroke={`color-mix(in srgb, ${CORAL} 35%, var(--border))`}
                />
                <text x={318 + j * 54 + 24} y={72 + i * 34 + 18} fontSize={11} fill="var(--ink)" textAnchor="middle">
                  w{"₁₂₃"[i]}{"₁₂"[j]}
                </text>
              </g>
            )),
          )}
          <text x={344} y={64} fontSize={10} fill="var(--faint)" textAnchor="middle">to h₁</text>
          <text x={398} y={64} fontSize={10} fill="var(--faint)" textAnchor="middle">to h₂</text>
          {["from x₁", "from x₂", "from x₃"].map((t, i) => (
            <text key={t} x={312} y={72 + i * 34 + 18} fontSize={10} fill="var(--faint)" textAnchor="end">{t}</text>
          ))}
          <text x={371} y={190} fontSize={10.5} fill="var(--muted)" textAnchor="middle">shape (3, 2)</text>
        </g>
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
        One entry per connection. The rows are where the signal comes from; the columns are where it goes.
      </figcaption>
    </figure>
  );
}

export default function LayerMatrixPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The forward pass", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 7 minutes"
        title={<>A layer is a matrix multiply</>}
        intro={<>The circles-and-arrows diagram is charming and completely unnecessary. It is a picture of a matrix
          multiplication, and once you can read one as the other, a forward pass stops being a diagram to trace and
          becomes four lines you could write from memory.</>}
      />

      <div className="lesson">
        <h2>Every arrow is a number</h2>
        <p>
          Three inputs feeding two hidden units means six arrows, and each arrow carries one weight. Six numbers,
          arranged in a grid with one row per input and one column per unit. That grid is the weight matrix.
        </p>

        <LayerAsMatrixFigure />

        <p>
          Unit <M>{String.raw`h_1`}</M> takes the three inputs, multiplies each by its own weight, and adds them —
          which is the dot product of <M>{String.raw`\mathbf{x}`}</M> with the first <em>column</em>. Unit{" "}
          <M>{String.raw`h_2`}</M> does the same with the second column. Doing both at once is precisely what{" "}
          <M>{String.raw`\mathbf{x}W`}</M> means.
        </p>

        <MathBlock>{String.raw`\mathbf{z} = \mathbf{x}W_1 + \mathbf{b}_1 \qquad\qquad \mathbf{h} = g(\mathbf{z})`}</MathBlock>

        <p>
          The bias vector has one entry per unit — the amount each unit adds regardless of input — and{" "}
          <M>{String.raw`g`}</M> is applied <strong>elementwise</strong>. That last word is worth pausing on: the
          activation never mixes units together. All the mixing happens in the matrix multiply; the activation just
          bends each channel on its own. A network alternates between those two operations and does nothing else.
        </p>

        <Callout color={CORAL} title={<>Mix, then bend, then mix again</>}>
          That is the entire architecture of a multilayer perceptron. <strong>Mix</strong> — a matrix multiply,
          which combines information across units but cannot introduce curvature. <strong>Bend</strong> — an
          elementwise non-linearity, which introduces curvature but cannot combine anything. Neither is sufficient
          alone, which is exactly what the last chapter proved twice. Everything else in deep learning is a
          variation on which mixing pattern you use: convolution mixes only with neighbours, attention decides its
          mixing weights per input, but the alternation is unchanged.
        </Callout>

        <h2>The whole forward pass</h2>
        <p>
          A two-hidden-layer network, in full. There is no fifth line.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`def forward(X, W1, b1, W2, b2, W3, b3):
    H1 = np.maximum(0, X  @ W1 + b1)     # mix, then bend
    H2 = np.maximum(0, H1 @ W2 + b2)     # mix, then bend
    return              H2 @ W3 + b3     # mix (no bend on the output)`}
        />

        <p>
          Two things to notice. The final layer has <strong>no activation</strong> — for a regression output you
          want the raw number, and for classification the non-linearity is folded into the loss function. The next
          page but one is entirely about that choice.
        </p>
        <p>
          And <M>{String.raw`X`}</M> is a matrix, not a vector. The identical code runs one example or ten thousand,
          because <M>{String.raw`XW`}</M> with <M>{String.raw`X`}</M> of shape{" "}
          <M>{String.raw`(n, d)`}</M> processes every row independently in one call. This is not a micro-optimisation
          — it is why networks are trainable at all. A single large matrix multiplication saturates a GPU;{" "}
          <M>{String.raw`n`}</M> small ones do not.
        </p>

        <h2>Count the parameters</h2>
        <p>
          A layer from <M>{String.raw`p`}</M> inputs to <M>{String.raw`q`}</M> units holds{" "}
          <M>{String.raw`pq`}</M> weights and <M>{String.raw`q`}</M> biases. Summing over a 4 → 32 → 32 → 16 → 1
          stack:
        </p>

        <CodeOutput>{`layer 1:  4 x 32 +  32 =   160
layer 2: 32 x 32 +  32 = 1,056
layer 3: 32 x 16 +  16 =   528
layer 4: 16 x  1 +   1 =    17
                  total = 1,761`}</CodeOutput>

        <p>
          That is the same 1,761-parameter network from the collapse experiment, which is now a number you can
          derive rather than take on faith. Two things fall out of the formula that are worth carrying:{" "}
          <strong>the cost is quadratic in width and only linear in depth</strong>, so a layer twice as wide costs
          four times as much while a network twice as deep costs about twice. And the widest single layer usually
          dominates everything else — here layer 2 alone is 60% of the network.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why can the activation function never do the job of the matrix multiply?</>,
              options: [
                "It is applied elementwise, so it can never combine information across units",
                "It is too simple a function",
                "It has no parameters to learn",
              ],
              answer: 0,
              explain: <>ReLU on unit 5 sees unit 5&rsquo;s value and nothing else. All cross-unit mixing lives in
                the matrix multiply, and all curvature lives in the activation. Having no parameters is true of ReLU
                but incidental — PReLU has one and still cannot mix.</>,
            },
            {
              q: <>A layer goes from 100 inputs to 200 units. How many parameters?</>,
              options: ["200", "20,000", "20,200"],
              answer: 2,
              explain: <><M>{String.raw`100 \times 200 = 20{,}000`}</M> weights plus one bias per unit, so{" "}
                <M>{String.raw`+200 = 20{,}200`}</M>. The biases are a rounding error at this size, which is why they
                are often skipped in mental estimates — but they are not optional to the model.</>,
            },
            {
              q: <>You double the width of every hidden layer. Roughly what happens to the parameter count?</>,
              options: ["It doubles", "It roughly quadruples", "It is unchanged"],
              answer: 1,
              explain: <>A hidden-to-hidden matrix is <M>{String.raw`p \times q`}</M> and both dimensions doubled, so
                that term goes up fourfold. Doubling <em>depth</em> instead only doubles the count — one reason depth
                is often the cheaper way to buy capacity.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/why-non-linearity", label: <>← Why non-linearity is non-negotiable</> }}
          next={{ href: "/learn/perceptron-to-mlp/shapes", label: <>Next up · Shapes, and how to keep them straight →</> }}
        />
      </div>
    </article>
  );
}
