import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeBlock } from "@/components/CodeBlock";
import { PerceptronRuleLab } from "@/components/labs/PerceptronRuleLab";

export const metadata = {
  title: "The perceptron learning rule — Manifold",
  description:
    "Wait for a mistake, then nudge the weights toward the point you got wrong. Four symbols, a convergence proof, and an accuracy curve that goes down as often as it goes up.",
};

const CORAL = "var(--c-neural)";

export default function LearningRulePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The unit", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 9 minutes"
        title={<>The perceptron learning rule</>}
        intro={<>You have a neuron with three numbers in it and no idea what they should be. The rule that fixes
          that is one line long, predates backpropagation by nearly thirty years, and comes with a guarantee that
          sounds much stronger than it is.</>}
      />

      <div className="lesson">
        <h2>The rule, in one sentence</h2>
        <p>
          Show the neuron a point. If it gets it right, do nothing. If it gets it wrong, move the weights a little
          in the direction that would have made it right.
        </p>
        <p>
          That is genuinely all of it. Writing labels as <M>{String.raw`t \in \{-1, +1\}`}</M> to keep the algebra
          short, the update on a mistake is:
        </p>

        <MathBlock>{String.raw`\mathbf{w} \;\leftarrow\; \mathbf{w} + \eta\, t\, \mathbf{x} \qquad\qquad b \;\leftarrow\; b + \eta\, t`}</MathBlock>

        <p>
          <M>{String.raw`\eta`}</M> is a step size. The whole content is the <M>{String.raw`t\mathbf{x}`}</M>: if the
          point should have been positive and wasn&rsquo;t, add the point to the weights, which tilts the boundary
          toward it. If it should have been negative, subtract it. The neuron leans toward whatever it just got
          wrong.
        </p>

        <Callout color={CORAL} title={<>Why adding the point is the right move</>}>
          After the update, the neuron&rsquo;s score on that same point changes by{" "}
          <M>{String.raw`\eta t(\mathbf{x}\cdot\mathbf{x} + 1)`}</M>, and{" "}
          <M>{String.raw`\mathbf{x}\cdot\mathbf{x} + 1`}</M> is always positive. So the score moves in the direction
          of <M>{String.raw`t`}</M> — up for a positive example, down for a negative one — <em>every single time</em>.
          The rule is not a heuristic that usually helps. It provably improves the point it was shown.
        </Callout>

        <p>
          Note what it does <em>not</em> promise: that it improves anything else. Tilting toward the point you just
          missed can push three other points onto the wrong side. Hold that thought.
        </p>

        <h2>Watch it run</h2>
        <p>
          Below is the rule executing on the 24 points from the last page, starting from a deliberately bad guess.
          The chart underneath tracks accuracy after every update.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>The data can be separated perfectly, and the rule is guaranteed to get there. What will the
            accuracy curve look like on the way?</>}
          options={[
            "Climbing steadily to 100%",
            "Flat, then a sudden jump at the end",
            "Up and down, with big drops, ending at 100%",
          ]}
          nudge="Locked in. Now drag the slider through all 30 updates."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Step through one update at a time and watch the circled point — that is the mistake which
            caused the update. Notice what happens to the other points when the boundary swings to catch it.</>}
          insight={<>Accuracy is not monotone. It reaches 87.5% at update 6, drops straight back to 50% at update
            7, climbs to 95.8% at update 25, falls to 79.2% at update 26 — and only lands on 100% at update 30. It
            hits exactly 50% on six separate occasions. This is not a bug and not a bad
            learning rate: <strong>the rule optimises one point at a time and has no idea the other twenty-three
            exist.</strong> It is the clearest possible illustration of why the field eventually moved to a loss
            function — a loss lets you ask about <em>all</em> the data at once.</>}
        >
          <PerceptronRuleLab />
        </LabFrame>

        <p>
          Thirty updates for twenty-four points, most of them undoing each other. And yet it does converge — which
          is the surprising part, and the reason this rule is famous.
        </p>

        <h2>The convergence theorem</h2>
        <p>
          <strong>If the data can be separated by some hyperplane, the perceptron rule will find one in a finite
          number of updates.</strong> Not the best one, not the widest-margin one — <em>a</em> separating one. And
          the bound on how many updates depends only on two geometric quantities: how far the points are from the
          origin, and how much room the best possible boundary has.
        </p>

        <MathBlock>{String.raw`\text{updates} \;\le\; \frac{R^2}{\gamma^2} \qquad\text{where}\quad R = \max_i \lVert \mathbf{x}_i \rVert,\quad \gamma = \text{the best achievable margin}`}</MathBlock>

        <p>
          Read that ratio as a signal-to-difficulty measure. Points spread far from the origin push{" "}
          <M>{String.raw`R`}</M> up; a problem where the classes barely clear each other pushes{" "}
          <M>{String.raw`\gamma`}</M> down. Neither the number of examples nor the number of features appears
          anywhere in it, which is genuinely remarkable — a separable problem in a million dimensions can converge
          in a handful of updates if the gap is wide.
        </p>

        <Proof color={CORAL} title="the two inequalities behind the bound">
          <p>
            Let <M>{String.raw`\mathbf{w}^*`}</M> be a unit-length separating direction with{" "}
            <M>{String.raw`t_i(\mathbf{w}^*\!\cdot\mathbf{x}_i) \ge \gamma`}</M> for every point. Take{" "}
            <M>{String.raw`\eta = 1`}</M> and start from <M>{String.raw`\mathbf{w}_0 = \mathbf{0}`}</M>. The proof
            squeezes <M>{String.raw`\lVert\mathbf{w}_k\rVert`}</M> between a line and a square root.
          </p>
          <p>
            <strong>It grows at least linearly in the right direction.</strong> Each update adds{" "}
            <M>{String.raw`t\mathbf{x}`}</M>, so
          </p>
          <MathBlock>{String.raw`\mathbf{w}^*\!\cdot\mathbf{w}_{k} = \mathbf{w}^*\!\cdot\mathbf{w}_{k-1} + t(\mathbf{w}^*\!\cdot\mathbf{x}) \;\ge\; \mathbf{w}^*\!\cdot\mathbf{w}_{k-1} + \gamma \;\;\Longrightarrow\;\; \mathbf{w}^*\!\cdot\mathbf{w}_k \ge k\gamma`}</MathBlock>
          <p>
            <strong>Its length grows at most as <M>{String.raw`\sqrt{k}`}</M>.</strong> An update happens only on a
            mistake, which means <M>{String.raw`t(\mathbf{w}_{k-1}\!\cdot\mathbf{x}) \le 0`}</M> — the cross term is
            never positive:
          </p>
          <MathBlock>{String.raw`\lVert\mathbf{w}_k\rVert^2 = \lVert\mathbf{w}_{k-1}\rVert^2 + 2t(\mathbf{w}_{k-1}\!\cdot\mathbf{x}) + \lVert\mathbf{x}\rVert^2 \;\le\; \lVert\mathbf{w}_{k-1}\rVert^2 + R^2 \;\;\Longrightarrow\;\; \lVert\mathbf{w}_k\rVert \le R\sqrt{k}`}</MathBlock>
          <p>
            Now combine. Since <M>{String.raw`\mathbf{w}^*`}</M> is a unit vector,{" "}
            <M>{String.raw`\mathbf{w}^*\!\cdot\mathbf{w}_k \le \lVert\mathbf{w}_k\rVert`}</M>, so{" "}
            <M>{String.raw`k\gamma \le R\sqrt{k}`}</M>, and therefore{" "}
            <M>{String.raw`k \le R^2/\gamma^2`}</M>. The number of mistakes is bounded, so the mistakes must stop.
          </p>
          <p>
            The elegance is in what is <em>absent</em>: no <M>{String.raw`n`}</M>, no{" "}
            <M>{String.raw`d`}</M>, no distributional assumption. The mistake budget is a purely geometric fact
            about the point cloud.
          </p>
        </Proof>

        <h2>In code</h2>
        <CodeBlock
          language="Python"
          fromScratch={`import numpy as np

def perceptron(X, y, lr=0.5, epochs=100):
    """y in {-1, +1}. Returns weights, bias, and whether it converged."""
    w = np.zeros(X.shape[1])
    b = 0.0
    for _ in range(epochs):
        mistakes = 0
        for xi, ti in zip(X, y):
            if ti * (w @ xi + b) <= 0:      # only ever act on a mistake
                w += lr * ti * xi
                b += lr * ti
                mistakes += 1
        if mistakes == 0:
            return w, b, True               # nothing left to fix
    return w, b, False`}
        />

        <p>
          Two details do real work. The condition is <M>{String.raw`\le 0`}</M>, not{" "}
          <M>{String.raw`< 0`}</M>, so a point sitting exactly on the boundary counts as a mistake — otherwise the
          all-zero weight vector is a fixed point and the algorithm never starts. And the loop exits on{" "}
          <em>zero mistakes in a full pass</em>, not on a fixed epoch count, because &ldquo;made it all the way
          round without erring&rdquo; is the only definition of done this rule has.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>The perceptron rule is running on separable data and accuracy just dropped from 92% to 50%. What
                should you conclude?</>,
              options: [
                "The learning rate is too high",
                "Nothing is wrong — the rule optimises one point at a time",
                "The data must not really be separable",
              ],
              answer: 1,
              explain: <>Each update provably improves <em>the point that triggered it</em> and says nothing about
                the others, so large drops are normal behaviour and appear in the run above. The learning rate
                changes the size of the swings but not their existence; with{" "}
                <M>{String.raw`\mathbf{w}_0=\mathbf{0}`}</M> it does not even change the sequence of boundaries, only
                their scale.</>,
            },
            {
              q: <>What does the convergence bound <M>{String.raw`R^2/\gamma^2`}</M> actually depend on?</>,
              options: [
                "The number of training examples",
                "The number of features",
                "How far the points sit from the origin, and how much room the best boundary has",
              ],
              answer: 2,
              explain: <>Neither <M>{String.raw`n`}</M> nor <M>{String.raw`d`}</M> appears. That is why the theorem
                still gets taught: the mistake budget is a geometric property of the point cloud, so a separable
                problem in very high dimensions can converge in a handful of updates provided the margin is wide.</>,
            },
            {
              q: <>Why does the algorithm treat a point sitting exactly on the boundary as a mistake?</>,
              options: [
                "To be conservative about ambiguous points",
                "Otherwise the all-zero weight vector is a fixed point and training never starts",
                "It makes the convergence proof shorter",
              ],
              answer: 1,
              explain: <>With <M>{String.raw`\mathbf{w}=\mathbf{0}`}</M> and <M>{String.raw`b=0`}</M> every point
                scores exactly zero. Under a strict <M>{String.raw`<0`}</M> test nothing is ever a mistake, no update
                ever fires, and the algorithm sits there declaring success on a model that outputs the same answer
                for everything.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/the-perceptron", label: <>← The perceptron</> }}
          next={{ href: "/learn/perceptron-to-mlp/what-the-guarantee-misses", label: <>Next up · What the guarantee does not cover →</> }}
        />
      </div>
    </article>
  );
}
