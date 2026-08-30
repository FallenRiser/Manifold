import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { NeuronLab } from "@/components/labs/NeuronLab";

export const metadata = {
  title: "The perceptron — Manifold",
  description:
    "One neuron computes a weighted sum and applies a switch. That is the entire object — the same three numbers a linear model has, plus a decision about what to do with the total.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// The unit, drawn once, so the rest of the track can refer back to it. All
// coordinates are literal: no hydration surface.
function NeuronFigure() {
  const W = 520, H = 170;
  const inputs = [
    { y: 42, label: "x₁", w: "w₁" },
    { y: 85, label: "x₂", w: "w₂" },
    { y: 128, label: "x₃", w: "w₃" },
  ];
  const cx = 268, cy = 85;

  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label="Three inputs multiplied by three weights, summed with a bias, passed through a switch, producing one output"
      >
        {inputs.map((inp) => (
          <g key={inp.label}>
            <circle cx={62} cy={inp.y} r={15} fill="var(--surface)" stroke="var(--border-strong)" />
            <text x={62} y={inp.y + 4} fontSize={12} fill="var(--ink)" textAnchor="middle">{inp.label}</text>
            <line x1={78} y1={inp.y} x2={cx - 26} y2={cy} stroke="var(--border-strong)" strokeWidth={1.3} />
            <text
              x={(78 + cx - 26) / 2}
              y={(inp.y + cy) / 2 - 5}
              fontSize={11}
              fill={CORAL}
              textAnchor="middle"
            >
              {inp.w}
            </text>
          </g>
        ))}

        {/* the bias: an input that is always 1 */}
        <text x={62} y={162} fontSize={11} fill="var(--faint)" textAnchor="middle">1</text>
        <line x1={74} y1={158} x2={cx - 20} y2={cy + 16} stroke="var(--border)" strokeWidth={1.2} strokeDasharray="3 3" />
        <text x={172} y={140} fontSize={11} fill="var(--faint)" textAnchor="middle">b</text>

        <circle cx={cx} cy={cy} r={26} fill="var(--surface)" stroke={CORAL} strokeWidth={1.6} />
        <text x={cx} y={cy + 5} fontSize={14} fill="var(--ink)" textAnchor="middle">Σ</text>

        <line x1={cx + 26} y1={cy} x2={cx + 68} y2={cy} stroke="var(--border-strong)" strokeWidth={1.3} />
        <text x={cx + 47} y={cy - 8} fontSize={11} fill="var(--muted)" textAnchor="middle">z</text>

        <rect x={cx + 68} y={cy - 26} width={62} height={52} rx={10} fill="var(--surface)" stroke={CORAL} strokeWidth={1.6} />
        {/* a step, drawn inside the box */}
        <polyline
          points={`${cx + 80},${cy + 13} ${cx + 99},${cy + 13} ${cx + 99},${cy - 13} ${cx + 118},${cy - 13}`}
          fill="none" stroke={CORAL} strokeWidth={1.8}
        />

        <line x1={cx + 130} y1={cy} x2={cx + 172} y2={cy} stroke="var(--border-strong)" strokeWidth={1.3} />
        <circle cx={cx + 192} cy={cy} r={16} fill="var(--surface)" stroke="var(--border-strong)" />
        <text x={cx + 192} y={cy + 4} fontSize={12} fill="var(--ink)" textAnchor="middle">ŷ</text>

        <text x={cx} y={cy + 48} fontSize={10} fill="var(--faint)" textAnchor="middle">weighted sum</text>
        <text x={cx + 99} y={cy + 48} fontSize={10} fill="var(--faint)" textAnchor="middle">the switch</text>
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
        Everything on the left of the switch is a linear model. Everything interesting about neural networks starts
        at the box on the right.
      </figcaption>
    </figure>
  );
}

export default function ThePerceptronPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The unit", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>The perceptron</>}
        intro={<>In 1958 Frank Rosenblatt built a machine that could learn to tell two kinds of thing apart, and
          the press reported that it would soon walk, talk and reproduce itself. The machine was a weighted sum
          and an if-statement. It is worth knowing exactly how little that is — and exactly how much.</>}
      />

      <div className="lesson">
        <h2>Start with something you can already do</h2>
        <p>
          You want to decide whether a photo shows a cat. You have two measurements: how pointy the ears are, and
          how long the whiskers are. Nobody has told you a rule, but you have a hunch that both count, and that
          pointiness counts for more.
        </p>
        <p>
          So you invent one. Multiply pointiness by 3, multiply whisker-length by 1, add them, and say &ldquo;cat&rdquo;
          if the total clears some threshold. That is a perceptron. There is no second, cleverer thing it does.
        </p>

        <MathBlock>{String.raw`z \;=\; w_1x_1 + w_2x_2 + \dots + w_dx_d + b \qquad\qquad \hat{y} \;=\; \begin{cases} 1 & z > 0 \\ 0 & z \le 0 \end{cases}`}</MathBlock>

        <NeuronFigure />

        <p>
          The <M>{String.raw`w_i`}</M> are the <strong>weights</strong> — how much each input counts, and in which
          direction. The <M>{String.raw`b`}</M> is the <strong>bias</strong>, which is just the threshold moved to
          the other side of the inequality so that everything compares against zero. And the switch on the end turns
          a number into a decision.
        </p>

        <Callout color={CORAL} title={<>You have seen this before, under a different name</>}>
          Take the same weighted sum and put a sigmoid on the end instead of a step, and you have written down{" "}
          <Link href="/learn/logistic-regression" style={link}>logistic regression</Link>, exactly. Take the same sum
          and put <em>nothing</em> on the end and you have written down{" "}
          <Link href="/learn/linear-regression" style={link}>linear regression</Link>, exactly. A neuron is not a new
          model. It is the model you already know, with a slot at the end for choosing what the number means.
        </Callout>

        <h2>Two weights and a bias are a line</h2>
        <p>
          Here is the part worth building a picture of, because everything later in this track leans on it. The
          boundary between &ldquo;on&rdquo; and &ldquo;off&rdquo; is the set of points where <M>{String.raw`z = 0`}</M>,
          and <M>{String.raw`w_1x_1 + w_2x_2 + b = 0`}</M> is the equation of a straight line. In three inputs it is a
          plane. In <M>{String.raw`d`}</M> inputs it is a flat <M>{String.raw`(d-1)`}</M>-dimensional slab called a{" "}
          <strong>hyperplane</strong>, which is a grand name for a very plain object: it has no curvature anywhere.
        </p>
        <p>
          The weights control the <em>direction</em> the line faces — the vector <M>{String.raw`(w_1, w_2)`}</M> points
          perpendicular to it, toward the &ldquo;on&rdquo; side. The bias slides the line back and forth without
          rotating it. That is all three numbers accounted for.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Below are 24 points that <em>can</em> be perfectly separated by a line. If you double both
            weights but leave the bias alone, what happens to the boundary?</>}
          options={[
            "It rotates to a new angle",
            "It stays in the same direction but slides",
            "Nothing visible changes at all",
          ]}
          nudge="Locked in. Now try it — set w₁ and w₂ to double their current values."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Get all 24 points right. Then double both weights and watch which way the line moves — its
            angle or its position. Then press the switch button and see what a sigmoid changes, and what it
            doesn&rsquo;t.</>}
          insight={<>Doubling both weights slides the line but never rotates it: the equation becomes{" "}
            <M>{String.raw`w_1x_1 + w_2x_2 + b/2 = 0`}</M>, so only the effective bias changed. Direction comes from
            the <em>ratio</em> of the weights, never their size. And
            switching from a step to a sigmoid changes the confidence of every prediction while leaving the boundary
            in exactly the same place. The switch decides what the output <em>means</em>; the weights decide where
            the line <em>is</em>.</>}
        >
          <NeuronLab />
        </LabFrame>

        <p>
          That last observation is worth stating plainly, because it is the reason this track can move fast later:{" "}
          <strong>the geometry lives in the weighted sum, and the switch only re-interprets it.</strong> When we
          replace the step with a sigmoid, a ReLU, or anything else, we are not changing what a unit can express in
          one layer. We are changing what happens when we stack them — and, as the next chapter shows, that turns
          out to be everything.
        </p>

        <h2>Why the bias is not optional</h2>
        <p>
          It is tempting to drop <M>{String.raw`b`}</M> for tidiness. Don&rsquo;t. Without a bias, <M>{String.raw`z = 0`}</M>{" "}
          forces the boundary through the origin, and a model that must pass through the origin cannot express
          &ldquo;almost everything is class 1 unless the inputs are large&rdquo;. In the lab above, set{" "}
          <M>{String.raw`b = 0`}</M> and try again: the line is pinned to the bottom-left corner and several points
          become unreachable.
        </p>
        <p>
          The common trick is to stop treating it as special — append a constant <M>{String.raw`1`}</M> to every input
          vector and let its weight <em>be</em> the bias. That is why the bias arrives in the figure above as a dashed
          input that is always on. It saves a term in every equation that follows.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What is the actual difference between a perceptron and logistic regression?</>,
              options: [
                "The perceptron has weights; logistic regression has coefficients",
                "What sits at the end: a hard step versus a sigmoid",
                "Logistic regression is linear and the perceptron is not",
              ],
              answer: 1,
              explain: <>They share the identical weighted sum, and both draw a straight boundary. The step outputs a
                bare decision; the sigmoid outputs a probability, which is what makes logistic regression trainable by
                gradient descent — a step has zero gradient almost everywhere. That difference matters enormously for{" "}
                <em>learning</em> and not at all for <em>what shapes the model can express</em>.</>,
            },
            {
              q: <>A neuron has 10 inputs. What kind of decision boundary can it draw?</>,
              options: [
                "A curved surface in 10 dimensions",
                "A flat 9-dimensional hyperplane",
                "Any shape, given enough training",
              ],
              answer: 1,
              explain: <>Flat, always. More inputs give the plane more directions to face, never any curvature. This
                is exactly the limitation the next chapter attacks — and no amount of training changes it, because it
                is a property of the equation, not of the fit.</>,
            },
            {
              q: <>Why does removing the bias term genuinely cost you something?</>,
              options: [
                "The model can no longer learn — there is nothing to update",
                "The boundary is forced through the origin, so whole families of rules become unexpressible",
                "It only affects training speed, not what the model can represent",
              ],
              answer: 1,
              explain: <>Setting <M>{String.raw`b=0`}</M> makes <M>{String.raw`z=0`}</M> pass through the origin. The model
                keeps its full range of <em>angles</em> and loses its ability to sit anywhere else, which rules out
                any problem whose natural boundary does not happen to go through zero.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp", label: <>← Perceptron → MLP</> }}
          next={{ href: "/learn/perceptron-to-mlp/the-learning-rule", label: <>Next up · The perceptron learning rule →</> }}
        />
      </div>
    </article>
  );
}
