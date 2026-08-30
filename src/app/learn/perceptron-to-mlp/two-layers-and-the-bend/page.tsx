import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { clipHalfPlane, halfPlanePolygon } from "@/components/labs/halfplane";

export const metadata = {
  title: "Two layers, and the bend — Manifold",
  description:
    "Two neurons draw two lines; a third combines them. The result is a boundary with a corner in it — and a corner is all XOR ever needed.",
};

const CORAL = "var(--c-neural)";

// Two half-planes and their intersection, built by hand so the reader can see
// the corner appear. Literal coordinates throughout: no hydration surface.
function BendFigure() {
  const W = 540, H = 200;
  const box = { x: 0, y: 0, w: 160, h: 160 };
  const pad = 18;

  // The two half-planes are clipped exactly, so the overlap in the third panel
  // is the real intersection rather than a hand-drawn approximation of one.
  const LO = -0.1, HI = 1.4;
  const OR: [number, number, number] = [1, 1, -0.5];      // x1 + x2 - 0.5 >= 0
  const NOT_AND: [number, number, number] = [-1, -1, 1.5]; // x1 + x2 - 1.5 <= 0

  const panel = (ox: number, title: string, kind: "a" | "b" | "both") => {
    const px = (v: number) => ox + pad + (v - LO) * (box.w - 2 * pad) / (HI - LO);
    const py = (v: number) => pad + (box.h - 2 * pad) - (v - LO) * (box.h - 2 * pad) / (HI - LO);
    const draw = (pts: [number, number][]) =>
      pts.map(([a, c]) => `${px(a).toFixed(2)},${py(c).toFixed(2)}`).join(" ");

    const regionA = halfPlanePolygon(OR[0], OR[1], OR[2], LO, HI);
    const regionB = halfPlanePolygon(NOT_AND[0], NOT_AND[1], NOT_AND[2], LO, HI);
    const overlap = clipHalfPlane(regionA, NOT_AND[0], NOT_AND[1], NOT_AND[2]);

    const lineA = draw([[LO, 0.5 - LO], [0.5 - LO, LO]]);
    const lineB = draw([[1.5 - HI, HI], [HI, 1.5 - HI]]);

    return (
      <g key={title}>
        <rect x={ox} y={0} width={box.w} height={box.h} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />
        {kind === "a" && (
          <>
            <polygon points={draw(regionA)} fill={CORAL} opacity={0.13} />
            <polyline points={lineA} fill="none" stroke={CORAL} strokeWidth={1.8} />
          </>
        )}
        {kind === "b" && (
          <>
            <polygon points={draw(regionB)} fill={CORAL} opacity={0.13} />
            <polyline points={lineB} fill="none" stroke={CORAL} strokeWidth={1.8} />
          </>
        )}
        {kind === "both" && (
          <>
            {/* the two contributing regions stay faint; only their intersection
                is drawn solidly, and outlined, so the strip is unmistakable */}
            <polygon points={draw(regionA)} fill={CORAL} opacity={0.05} />
            <polygon points={draw(regionB)} fill={CORAL} opacity={0.05} />
            <polygon points={draw(overlap)} fill={CORAL} opacity={0.28} stroke={CORAL} strokeWidth={1.2} strokeDasharray="3 2" />
            <polyline points={lineA} fill="none" stroke={CORAL} strokeWidth={1.8} />
            <polyline points={lineB} fill="none" stroke={CORAL} strokeWidth={1.8} />
          </>
        )}
        {/* the four XOR points */}
        {([[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]] as const).map(([a, b, lab], i) => (
          <circle
            key={i}
            cx={Number(px(a).toFixed(2))} cy={Number(py(b).toFixed(2))} r={5}
            fill={lab === 1 ? "var(--ink)" : "var(--canvas)"}
            stroke="var(--ink)" strokeWidth={1.5}
          />
        ))}
        <text x={ox + box.w / 2} y={box.h + 18} fontSize={11} fill="var(--muted)" textAnchor="middle">{title}</text>
      </g>
    );
  };

  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label="Three panels: the region above one line, the region below a second line, and their overlap, which contains exactly the two XOR positive points"
      >
        {panel(0, "unit 1 says yes here", "a")}
        {panel(190, "unit 2 says yes here", "b")}
        {panel(380, "both — the overlap", "both")}
        <text x={175} y={80} fontSize={16} fill="var(--faint)" textAnchor="middle">+</text>
        <text x={365} y={80} fontSize={16} fill="var(--faint)" textAnchor="middle">=</text>
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
        Filled points are XOR&rsquo;s 1s. Neither line separates them; the strip where <em>both</em> units agree
        contains exactly those two and nothing else.
      </figcaption>
    </figure>
  );
}

export default function TwoLayersPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "One neuron is not enough", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>Two layers, and <em>the bend</em></>}
        intro={<>The fix for XOR is not a cleverer line. It is two ordinary lines and something that combines them —
          which produces a boundary shape that no single neuron can make, and which turns out to be the entire idea
          behind every deep network since.</>}
      />

      <div className="lesson">
        <h2>Ask two questions instead of one</h2>
        <p>
          A single neuron gets one question: <em>which side of my line are you on?</em> That is why XOR defeats it —
          XOR is not answerable from one such question. But it <em>is</em> answerable from two.
        </p>
        <p>
          Ask: <strong>is at least one input on?</strong> That is OR, and it is a line. Then ask:{" "}
          <strong>are both inputs on?</strong> That is AND, and it is also a line. XOR is exactly &ldquo;the first
          is true and the second is false&rdquo;. Two linear questions, combined by one more linear question.
        </p>

        <BendFigure />

        <p>
          The third panel is the whole trick. Each unit shades a half-plane, and neither one is any use alone. Where
          the two shaded regions overlap you get a <strong>strip</strong> — a region with two boundaries, which is
          not a half-plane and cannot be produced by any single neuron at any setting. It contains both filled
          points and neither hollow one.
        </p>
        <p>
          These two particular lines happen to be parallel, so the overlap is a straight strip. Tilt one of them and
          the overlap becomes a wedge with a genuine corner in it; add a third unit and you can cut a triangle. What
          two layers give you is not one specific shape — it is <strong>intersections of half-planes</strong>, which
          is a far larger family than half-planes.
        </p>

        <Callout color={CORAL} title={<>What the second layer is doing</>}>
          The output neuron is not doing anything exotic. It is drawing a straight line — but in a space whose two
          axes are <em>&ldquo;how much does unit 1 say yes&rdquo;</em> and <em>&ldquo;how much does unit 2 say
          yes&rdquo;</em>. It is linear in the coordinates it is given. The coordinates just are not the ones you
          started with. Every layer in every network does this and only this: <strong>draw something simple in a
          space the previous layer built.</strong>
        </Callout>

        <h2>Doing it by hand</h2>
        <p>
          With a step activation you can write the XOR network down without any training at all. Let{" "}
          <M>{String.raw`h_1`}</M> be OR and <M>{String.raw`h_2`}</M> be AND:
        </p>

        <MathBlock>{String.raw`h_1 = \text{step}(x_1 + x_2 - 0.5) \qquad h_2 = \text{step}(x_1 + x_2 - 1.5) \qquad \hat{y} = \text{step}(h_1 - h_2 - 0.5)`}</MathBlock>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {["x₁", "x₂", "h₁ (OR)", "h₂ (AND)", "h₁ − h₂ − 0.5", "ŷ", "XOR"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 16px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["0", "0", "0", "0", "−0.5", "0", "0"],
                ["0", "1", "1", "0", "+0.5", "1", "1"],
                ["1", "0", "1", "0", "+0.5", "1", "1"],
                ["1", "1", "1", "1", "−0.5", "0", "0"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "5px 16px 5px 0", color: j >= 5 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Nine numbers, and the impossible problem is solved exactly. Note the column that does the work:{" "}
          <M>{String.raw`h_1 - h_2`}</M> is 1 for precisely the two middle rows. In the original coordinates those
          two rows sit on opposite corners; in <M>{String.raw`(h_1, h_2)`}</M> coordinates they sit on the same
          point.
        </p>

        <h2>And when you train it instead</h2>
        <p>
          A trained network finds its own version, and it is worth seeing that it does not find yours. Fitting a
          2-hidden-unit tanh network to the same four points:
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`mlp = MLPClassifier(hidden_layer_sizes=(2,), activation="tanh",
                    solver="lbfgs", max_iter=5000, random_state=1).fit(X, y)

print("accuracy:", accuracy_score(y, mlp.predict(X)))
for xi, hi in zip(X, np.tanh(X @ mlp.coefs_[0] + mlp.intercepts_[0])):
    print(f"  x={xi.tolist()} -> h=[{hi[0]:+.3f}, {hi[1]:+.3f}]")`}
        />
        <CodeOutput>{`accuracy: 1.0
  x=[0.0, 0.0] -> h=[+0.932, +1.000]
  x=[0.0, 1.0] -> h=[-0.958, +0.978]
  x=[1.0, 0.0] -> h=[-0.953, +0.969]
  x=[1.0, 1.0] -> h=[-1.000, -0.922]`}</CodeOutput>

        <p>
          It did not learn OR and AND. It learned something with no tidy name — but look at the two middle rows:{" "}
          <M>{String.raw`(-0.958, 0.978)`}</M> and <M>{String.raw`(-0.953, 0.969)`}</M>, all but identical. The
          network discovered the same <em>structural</em> move (collapse the two 1s together, push the 0s apart) via
          completely different weights.
        </p>
        <p>
          That is worth remembering the first time you open a trained network and find nothing interpretable inside.
          <strong> The solution a network finds is one of an enormous family of equivalent ones</strong>, and
          expecting it to match your hand-designed features is expecting a coincidence.
        </p>

        <h2>Capacity is necessary, not sufficient</h2>
        <p>
          One honest complication before moving on. We just showed a 2-unit network <em>can</em> represent XOR. It
          does not follow that training will find it. Running the same fit from 50 different random initialisations:
        </p>

        <CodeOutput>{`2 hidden units, 50 random seeds: solved 25/50
4 hidden units, 50 random seeds: solved 49/50`}</CodeOutput>

        <p>
          At the minimum viable size it works <strong>half the time</strong>. Double the width — adding capacity
          that is provably unnecessary — and it works 49 times out of 50. The extra units are not buying
          expressiveness; they are buying more chances for <em>some</em> pair of units to start out usefully
          arranged.
        </p>
        <p>
          File that away. &ldquo;Make it a bit bigger than it strictly needs to be&rdquo; is one of the most
          reliable pieces of practical advice in the whole field, and this is the smallest experiment that shows
          why it works.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What lets a two-layer network produce a boundary that is not a single straight cut?</>,
              options: [
                "The output neuron draws a curved line",
                "The intersection of two half-planes is not a half-plane",
                "The hidden units use a non-linear activation instead of a step",
              ],
              answer: 1,
              explain: <>Each hidden unit still contributes only a straight cut. Combining two of them selects an
                overlap region whose shape — a strip, a wedge, a corner — no single neuron can express. The output
                neuron remains perfectly linear in the space the hidden layer built.</>,
            },
            {
              q: <>A trained XOR network&rsquo;s hidden units compute nothing resembling AND or OR. What does that
                tell you?</>,
              options: [
                "The network is undertrained and should be run longer",
                "Many different weight settings solve the problem equally well",
                "The hidden units have learned something wrong that happens to work",
              ],
              answer: 1,
              explain: <>It reaches 100% accuracy, so nothing is wrong. Solutions come in large equivalent families
                — permute the hidden units, rescale them, flip signs and compensate downstream — and gradient
                descent lands in whichever one its initialisation was nearest.</>,
            },
            {
              q: <>Two hidden units solve XOR from only 25 of 50 random starts; four units solve it from 49. What is
                the extra capacity buying?</>,
              options: [
                "Expressiveness — four units can represent functions two cannot",
                "More chances that some pair of units initialises into a workable arrangement",
                "A lower final training loss on the runs that succeed",
              ],
              answer: 1,
              explain: <>Two units are provably enough to <em>represent</em> XOR, so expressiveness is not the
                constraint — reachability is. Extra width makes a good starting configuration much more likely,
                which is the real reason the practical advice is to build slightly bigger than the minimum.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/the-xor-problem", label: <>← The XOR problem</> }}
          next={{ href: "/learn/perceptron-to-mlp/hidden-units-are-features", label: <>Next up · Hidden units are learned features →</> }}
        />
      </div>
    </article>
  );
}
