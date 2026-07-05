import { M } from "@/components/Math";
import { DecisionBoundaryLab } from "@/components/labs/DecisionBoundaryLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "The decision boundary — Manifold",
  description: "In two dimensions the sigmoid's 0.5 line becomes a straight boundary across the plane — aim it by hand and learn why logistic regression is a linear classifier.",
};

export default function DecisionBoundaryPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>The decision boundary</>}
        intro={<>
          With one feature, the model&rsquo;s &ldquo;mind changes&rdquo; at a single point on the
          axis. With two features it changes along a <em>line</em> — and that line is the most
          useful picture in classification.
        </>}
      />

      <div className="lesson">
        <p>
          The model says &ldquo;class 1&rdquo; wherever <M>{String.raw`\sigma(w_1 x_1 + w_2 x_2 + b) \ge 0.5`}</M>.
          But the sigmoid crosses 0.5 exactly where its input is zero, so the frontier is simply
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`w_1 x_1 + w_2 x_2 + b = 0`}</M>
        </p>
        <p>
          — the equation of a straight line. Everything on one side is called class 1, everything
          on the other class 0, and the probability ramps smoothly from one side to the other.
          This is why logistic regression is called a <strong>linear classifier</strong>: whatever
          it learns, its verdict-changing frontier is a line (a flat plane in more dimensions).
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>Doubling all three numbers — w₁, w₂ and b — changes the boundary line how?</>}
          options={["Rotates it", "Shifts it sideways", "Doesn't move it at all"]}
          nudge={<>Locked in. In the lab, get a decent boundary, then double each slider (e.g. 1, 1, 0 → 2, 2, 0) and watch both the line and the dotted probability bands.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Aim the boundary with the three sliders until as few points as possible wear red rings. Watch the dotted p&nbsp;=&nbsp;0.25 / 0.75 bands too — then snap to the fitted solution.</>}
          insight={<>Scaling all the weights up leaves the boundary <em>exactly in place</em> but pulls the dotted bands
            tight against it — same verdicts, more confidence. That&rsquo;s the extra dimension accuracy can&rsquo;t see:
            two boundaries with identical accuracy can make wildly different probability claims. Also: the fitted
            solution scores only 90% here, because 7% of these labels are genuine noise — a model that forced its way
            to 100% would be memorising mistakes.</>}
        >
          <DecisionBoundaryLab />
        </LabFrame>

        <h2>Direction, offset, steepness</h2>
        <p>
          The three sliders map onto three geometric jobs. The <strong>ratio</strong> of{" "}
          <M>w_1</M> to <M>w_2</M> sets the boundary&rsquo;s <em>direction</em> — the weight vector{" "}
          <M>{String.raw`(w_1, w_2)`}</M> points perpendicular to the line, toward the class-1
          side. The bias <M>b</M> slides the line back and forth without turning it. And the{" "}
          <strong>overall size</strong> of the weights sets how fast probability ramps across the
          boundary — the spacing of those dotted bands. Accuracy only sees the line&rsquo;s
          position; log loss sees the ramp too.
        </p>

        <h2>What a linear classifier can&rsquo;t do</h2>
        <p>
          A straight frontier is a real limitation: if the true classes wrap around each other —
          one class in a ring around the other, say — no line separates them, and logistic
          regression tops out at whatever a line can salvage. The fixes are the same ones
          regression used: engineer curvier features (add <M>{String.raw`x_1^2,\ x_1 x_2`}</M> and
          the &ldquo;line&rdquo; in that bigger space bends in the original one), or switch to a
          model family with curved boundaries. That trade — simple, interpretable frontier vs
          flexible one — is the classification version of a story you already know.
        </p>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A trained model has weights w = (3, −1), bias b = 0. A point sits exactly on the boundary. What probability does the model assign it?",
              options: ["0 — it's unclassifiable", "0.5 exactly", "Depends on the point"],
              answer: 1,
              explain: "On the boundary the score w·x + b is zero, and σ(0) = 0.5 always. The boundary is precisely the set of points where the model shrugs.",
            },
            {
              q: "You multiply every weight and the bias by 10. Accuracy on the training set…",
              options: ["Stays identical", "Usually improves", "Usually collapses"],
              answer: 0,
              explain: "The boundary w·x + b = 0 doesn't move when everything scales, so every verdict is unchanged — accuracy is identical. Only the confidence ramp changes (and log loss with it).",
            },
            {
              q: "Why did the fitted solution in the lab stop around 90% instead of finding a 100% boundary?",
              options: ["The optimiser got stuck in a local minimum", "Some labels are noise — no line, or any model, should fit them", "The learning rate was too small"],
              answer: 1,
              explain: "The dataset has 7% flipped labels by construction. The overlapping points aren't a failure of the fit — they're the honest structure of the data, and chasing them is overfitting.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/the-sigmoid", label: <>← The sigmoid</> }}
          next={{ href: "/learn/logistic-regression/log-loss", label: <>Next up · Log loss →</> }}
        />
      </div>
    </article>
  );
}
