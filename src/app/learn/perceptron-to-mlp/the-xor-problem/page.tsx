import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { XorLab } from "@/components/labs/XorLab";

export const metadata = {
  title: "The XOR problem — Manifold",
  description:
    "Four points, no noise, and no line that works. The smallest possible proof that a single neuron is not a universal learner — and why collecting more data cannot help.",
};

const CORAL = "var(--c-neural)";

export default function XorPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "One neuron is not enough", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>The XOR problem</>}
        intro={<>Most limitations in machine learning are soft: this model is a bit worse, that one needs more data.
          This one is not. Here are four points, with no noise, no ambiguity and no missing information, that a
          single neuron cannot classify — not slowly, not approximately. Ever.</>}
      />

      <div className="lesson">
        <h2>The four points</h2>
        <p>
          Two binary inputs. The output is 1 when <em>exactly one</em> of them is 1 — the &ldquo;exclusive or&rdquo;.
          It is the rule behind &ldquo;you may have soup or salad&rdquo;, and behind a light switch at the top and
          bottom of a staircase.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {["x₁", "x₂", "AND", "OR", "XOR"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["0", "0", "0", "0", "0"],
                ["0", "1", "0", "1", "1"],
                ["1", "0", "0", "1", "1"],
                ["1", "1", "1", "1", "0"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "5px 18px 5px 0", color: j === 4 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          AND and OR are both fine for a single neuron. AND is &ldquo;the total clears 1.5&rdquo;; OR is &ldquo;the
          total clears 0.5&rdquo;. Both are one line, and you can draw them without thinking.
        </p>
        <p>
          XOR is not. Look at where the 1s are: the two <em>opposite corners</em> (0,1) and (1,0). The two 0s are on
          the other diagonal. Any line you draw has the plane on either side of it, and each diagonal passes through
          both sides.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Before you try it: with three numbers to tune and only four points to get right, what is the
            best accuracy a single neuron can reach on XOR?</>}
          options={["4 of 4, with the right settings", "3 of 4, and no better", "2 of 4 — no better than guessing"]}
          nudge="Locked in. Now spend a minute genuinely trying to beat it below."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Try honestly to get 4 of 4. Rotate the line to every angle; slide it in and out with the bias.
            When you are convinced, press <em>Add a hidden layer</em>.</>}
          insight={<>Three is the ceiling, and it is not a tuning failure — 20,000 randomly sampled half-planes
            reached exactly 0.7500 and never more. But in the hidden-layer view the same four points are laid out
            differently, and a line works immediately. <strong>The hidden layer did not classify anything. It moved
            the points until the problem became easy.</strong> That sentence is what the rest of this track is
            about.</>}
        >
          <XorLab />
        </LabFrame>

        <Callout color={CORAL} title={<>Not a failure of effort</>}>
          It is tempting to assume you just did not find the right angle. So we checked exhaustively: 20,000 random
          weight-and-bias combinations on these four points. The best accuracy any of them achieved was{" "}
          <strong>0.7500</strong> — three points. And a fitted logistic regression does something even more telling:
          it returns <strong>0.5 for all four inputs</strong>, having correctly concluded that no linear signal
          exists and the safest thing it can do is shrug uniformly.
        </Callout>

        <CodeBlock
          language="Python"
          fromScratch={`X = np.array([[0., 0.], [0., 1.], [1., 0.], [1., 1.]])
y = np.array([0, 1, 1, 0])

lin = LogisticRegression().fit(X, y)
print("accuracy:", accuracy_score(y, lin.predict(X)))
print("probabilities:", np.round(lin.predict_proba(X)[:, 1], 4))`}
        />
        <CodeOutput>{`accuracy: 0.5
probabilities: [0.5 0.5 0.5 0.5]`}</CodeOutput>

        <h2>Why more data cannot help</h2>
        <p>
          This is the part that makes XOR worth a page rather than a footnote. Almost every other problem in this
          course gets better with more data. This one does not, and understanding why inoculates you against a very
          common misdiagnosis.
        </p>
        <p>
          The limitation is not in the <em>data</em>. It is in the <em>hypothesis class</em> — the set of functions
          the model is able to express at all. A single neuron can express exactly the half-plane rules, and XOR is
          not one of them. Collecting a million more XOR examples adds a million more points to a set the model
          already cannot represent. The failure is not statistical, so no amount of statistics addresses it.
        </p>

        <Proof color={CORAL} title="the one-line proof that no line works">
          <p>
            Suppose some <M>{String.raw`w_1, w_2, b`}</M> classify XOR correctly. Write{" "}
            <M>{String.raw`z(x_1,x_2) = w_1x_1 + w_2x_2 + b`}</M>. Correctness requires:
          </p>
          <MathBlock>{String.raw`z(0,0) \le 0, \quad z(1,1) \le 0, \quad z(0,1) > 0, \quad z(1,0) > 0`}</MathBlock>
          <p>
            Add the first two inequalities: <M>{String.raw`z(0,0) + z(1,1) = b + (w_1 + w_2 + b) \le 0`}</M>. Add
            the last two: <M>{String.raw`z(0,1) + z(1,0) = (w_2 + b) + (w_1 + b) > 0`}</M>.
          </p>
          <p>
            But both sums equal the same expression, <M>{String.raw`w_1 + w_2 + 2b`}</M>. So that quantity must be
            simultaneously <M>{String.raw`\le 0`}</M> and <M>{String.raw`> 0`}</M>. Contradiction — no such weights
            exist.
          </p>
          <p>
            The geometry behind the algebra: the two classes have <strong>the same midpoint</strong>,{" "}
            <M>{String.raw`(0.5, 0.5)`}</M>. A linear score is an average-preserving map, so it assigns both classes
            the same mean score, which no threshold can separate. Any dataset whose class means coincide is
            hopeless for a linear model, and XOR is simply the smallest example.
          </p>
        </Proof>

        <h2>The 1969 detour</h2>
        <p>
          Minsky and Papert published this argument in <em>Perceptrons</em> in 1969. The mathematics was correct and
          the conclusion drawn from it was not: everyone already knew that stacking layers would fix XOR; nobody
          knew how to <em>train</em> a stack. Without a training method, the extra layers were unreachable in
          practice, and funding moved elsewhere for roughly fifteen years.
        </p>
        <p>
          Which sets up the shape of the next three pages exactly. The fix is layers. The bill for layers is a way
          to compute the gradient through them — and that is a whole track of its own.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Your model plateaus at 75% on a problem. Which fact would make &ldquo;collect more data&rdquo; the
                wrong response?</>,
              options: [
                "That the training and validation scores are both 75%",
                "That the true rule is not expressible by your model at all",
                "That the dataset is already large",
              ],
              answer: 1,
              explain: <>If the rule lies outside the hypothesis class, extra data adds examples of something the
                model cannot represent. A matching train and validation score is a strong <em>hint</em> in that
                direction — you are not overfitting — but the decisive fact is expressibility.</>,
            },
            {
              q: <>What does the hidden-layer view of XOR actually show?</>,
              options: [
                "The hidden layer classifies the points, and the output layer copies its answer",
                "The hidden layer repositions the points so that a line suffices",
                "The hidden layer adds a curved boundary in the original input space",
              ],
              answer: 1,
              explain: <>In hidden space the two 1s land almost on top of each other and a straight line separates
                the classes easily. The output layer is still just a neuron drawing a plain line — it is the
                <em> coordinates</em> that changed. That is the mechanism behind every deep network.</>,
            },
            {
              q: <>Why does logistic regression return exactly 0.5 on all four XOR points rather than an uneven
                split?</>,
              options: [
                "It failed to converge and returned its initial values",
                "The two classes share the same mean, so the optimum is a zero-weight model",
                "It needs a smaller learning rate for this problem",
              ],
              answer: 1,
              explain: <>Both classes have midpoint (0.5, 0.5). Any non-zero weight vector helps on one diagonal and
                hurts equally on the other, so log loss is genuinely minimised at{" "}
                <M>{String.raw`\mathbf{w} = \mathbf{0}`}</M>. The 0.5s are the correct answer to the question it was
                asked, which is why the failure is so quiet.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/what-the-guarantee-misses", label: <>← What the guarantee does not cover</> }}
          next={{ href: "/learn/perceptron-to-mlp/two-layers-and-the-bend", label: <>Next up · Two layers, and the bend →</> }}
        />
      </div>
    </article>
  );
}
