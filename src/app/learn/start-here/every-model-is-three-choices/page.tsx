import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-fundamentals)";

export const metadata = {
  title: "Every model is three choices — Manifold",
  description: "Shape, loss, optimiser: the three-part anatomy shared by every machine learning model, from a straight line to a neural network.",
};

export default function ThreeChoicesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Start here", color: ACCENT }, { label: "No prerequisites", color: "var(--c-regression)" }]}
        time="about 6 minutes"
        title={<>Every model is three choices</>}
        intro={<>
          Machine learning looks like a zoo of unrelated algorithms — until you see that every
          single one is the same three decisions in a trench coat.
        </>}
      />

      <div className="lesson">
        <p>
          When you fit the line two pages ago, three separate things were quietly true, and
          they&rsquo;re worth pulling apart — because these same three parts show up in every
          model ever trained.
        </p>

        <h2>Choice 1 — a shape</h2>
        <p>
          First, you committed to fitting a <em>straight line</em>. That was a choice: you could
          have drawn a curve, a staircase, a wiggle. The <strong>shape</strong> (the formal word is{" "}
          <em>model family</em>) decides what kinds of patterns you&rsquo;re even able to express.
          A straight line can capture &ldquo;bigger house, higher price&rdquo; but can never
          capture &ldquo;prices rise until noon and fall after.&rdquo; Choosing a shape is choosing
          what you allow yourself to see.
        </p>

        <h2>Choice 2 — a score for wrongness</h2>
        <p>
          Second, you needed the error readout. Without a single number for &ldquo;how wrong is
          this line?&rdquo;, the word <em>best</em> has no meaning — best <em>according to
          what?</em> The <strong>loss function</strong> is that number. It sounds like a technical
          detail, but it&rsquo;s where your values enter the model: is one huge miss worse than
          ten small ones? Is a false alarm as costly as a missed fraud? Different answers, different
          loss, different model.
        </p>

        <h2>Choice 3 — a way to improve</h2>
        <p>
          Third, you dragged the line to shrink the error — check, nudge, check again. Computers do
          the same with an <strong>optimiser</strong>: a procedure that adjusts the model&rsquo;s
          knobs to push the loss down. The workhorse, called <em>gradient descent</em>, works
          exactly like finding your way downhill in fog — feel which way the ground slopes, step
          that way, repeat. The linear regression track builds it up until it feels obvious.
        </p>

        <Callout color={ACCENT} title={<>The pattern to keep</>}>
          <strong>Model = shape + loss + optimiser.</strong> Linear regression: a line, squared
          error, gradient descent. A neural network: stacked layers, cross-entropy, gradient
          descent again. When you meet an unfamiliar algorithm, ask what shape, what loss, what
          optimiser — and it will usually stop being unfamiliar on the spot.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A colleague says their fancy new model \"minimises mean absolute error using gradient descent over a decision-tree ensemble.\" Which part is the loss?",
              options: ["The decision-tree ensemble", "Mean absolute error", "Gradient descent"],
              answer: 1,
              explain: "The loss is the score for wrongness — here, mean absolute error. The tree ensemble is the shape, and gradient descent is the optimiser.",
            },
            {
              q: "You fit a straight line to data that actually follows a U-shaped curve. Which of the three choices doomed the fit?",
              options: ["The shape — a line can't express a U", "The loss — squared error is wrong here", "The optimiser — it needed more steps"],
              answer: 0,
              explain: "No loss or optimiser can rescue a shape that can't express the pattern. A straight line simply has no U in its vocabulary — you'd need a curvier model family.",
            },
            {
              q: "In the house-price lab, which of the three parts were YOU playing?",
              options: ["The shape", "The loss", "The optimiser"],
              answer: 2,
              explain: "You adjusted the knobs (the line's tilt) to push the error down — that's the optimiser's job. The shape was fixed (a line) and the loss was computed for you (the error readout).",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/start-here/three-kinds-of-learning", label: <>← The three kinds of learning</> }}
          next={{ href: "/learn/start-here/how-to-read-this-site", label: <>Next up · How to read this site →</> }}
        />
      </div>
    </article>
  );
}
