import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";
import { DiagnosticQuadrant } from "@/components/figures/nnReg/RegFigures";

export const metadata = {
  title: "The neural networks family: what you now have — Manifold",
  description:
    "The capstone of the six-track neural networks family. A neural network is a stack of simple units, and every track was one decision about that stack: the unit, its training, its nonlinearity, its size, its starting point, and its generalisation.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function FamilySummaryPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Combining regularisers", color: CORAL },
          { label: "Tier 1 · intuition", color: CORAL },
        ]}
        time="about 7 minutes"
        title={<>The neural networks family: what you now have</>}
        intro={<>This is the last page of the last track. Six tracks ago you had a single artificial
          neuron and a question about how to draw a line. You now have a trained, sized, initialised,
          generalising neural network and — more importantly — the reasoning behind every choice inside it.
          This page walks the whole arc and names the through-line that ran under all of it.</>}
      />

      <div className="lesson">
        <h2>The arc, one track at a time</h2>
        <p>
          <Link href="/learn/perceptron-to-mlp" style={link}>Perceptron &rarr; MLP</Link> built the{" "}
          <strong>unit and the forward pass</strong>. You started with a single neuron — a weighted sum
          and a threshold — saw exactly what one line can and cannot separate, and then stacked units into
          layers until the network could bend a boundary into any shape. That is where the object of study
          was born: not a formula, but a stack of simple units feeding one another.
        </p>
        <p>
          <Link href="/learn/backpropagation" style={link}>Backpropagation</Link> made it{" "}
          <strong>trainable</strong>. A stack of units is useless until you can set its weights, and
          backprop is how the error at the output is handed back through the stack so every weight learns
          its share of the blame. You saw the chain rule become an algorithm, and why it is cheap enough to
          run on billions of parameters.
        </p>
        <p>
          <Link href="/learn/activation-functions" style={link}>Activation functions</Link> chose the{" "}
          <strong>nonlinearity</strong>. The one component that makes the stack more than a single linear
          map, examined honestly: why saturating units stall gradients, why ReLU became the default, and
          how the choice of nonlinearity shapes what and how fast the network learns.
        </p>
        <p>
          <Link href="/learn/architecture-design" style={link}>Architecture design</Link>{" "}
          <strong>sized</strong> it. How wide, how deep — answered from measurements rather than folklore.
          Width buys capacity with diminishing returns; depth buys composition when the problem has a
          hierarchy and costs accuracy when it does not. You learned to read the train&ndash;test gap and
          let it drive the decision.
        </p>
        <p>
          <Link href="/learn/initialisation-and-normalisation" style={link}>Initialisation &amp;
          normalisation</Link> gave it a <strong>trainable starting point</strong>. A well-sized network
          still fails if it starts in the wrong place; you saw why careful initialisation keeps signal alive
          through many layers and how normalisation holds each layer&rsquo;s inputs in a sane range — the
          machinery that makes depth tractable at all.
        </p>
        <p>
          <Link href="/learn/nn-regularisation" style={link}>Regularisation</Link> — this track — made it{" "}
          <strong>generalise</strong>. A network that trains perfectly can still fail on new data. You built
          one that genuinely overfits (train 1.000, test 0.753) and then closed the gap with dropout,
          augmentation, weight decay, early stopping, and their combinations — always measured, never
          assumed.
        </p>

        <Callout color={CORAL} title={<>The through-line</>}>
          A neural network is a stack of simple units, and <strong>every track was one decision about that
          stack</strong>: what the unit is (perceptron), how to train it (backprop), what nonlinearity to
          put in it (activations), how many to stack (architecture), how to start them (initialisation and
          normalisation), and how to keep the trained stack honest on new data (regularisation). Six
          decisions, one object. That is the whole family.
        </Callout>

        <DiagnosticQuadrant
          caption={<>What six tracks add up to, in one square. Architecture design taught you to place
            a model in it; initialisation and normalisation are mostly about not landing in the
            bottom-left by accident; this track is the treatment for the top-right cell and nothing
            else. The value of the family is not any single technique in it — it is being able to look
            at two numbers and know which of these four situations you are in before you touch
            anything.</>}
        />

        <h2>What &ldquo;you now have&rdquo; actually means</h2>
        <p>
          Not six disconnected topics — one connected competence. Handed a new problem and a network that is
          not working, you can now localise the fault instead of guessing. Is the training loss high? That
          is capacity or optimisation — architecture, activations, initialisation. Is training fine but test
          poor? That is a generalisation gap — regularisation. Does the loss refuse to move at all? Suspect
          the starting point and the gradients. Each symptom points at a track, and each track hands you a
          measurement to confirm the diagnosis before you spend effort on a fix.
        </p>
        <p>
          You also carry the habit the whole family was built to teach: <strong>trust the measurement over
          the folklore</strong>. Depth beyond 2 hurt on moons. Weight decay was inert here while dropout
          worked. Two regularisers of the same kind interfered. None of those are things a textbook ordering
          would have told you — they are things the numbers told you, and the numbers are where you will keep
          going for answers.
        </p>

        <h2>Where you go next</h2>
        <p>
          The fundamentals are complete, and they are the same fundamentals under every architecture you have
          not met yet. A convolutional network is this stack with weight-sharing; a transformer is this stack
          with attention deciding what feeds what; a residual network is this stack with shortcuts that keep
          the gradient alive — exactly the problem the initialisation track taught you to see. You will
          recognise the unit, the training, the nonlinearity, the sizing, the starting point, and the
          regularisation inside every one of them.
        </p>
        <p>
          For putting it all to work end to end, the <Link href="/learn/asteroid-hazard-capstone" style={link}>capstone
          projects</Link> take a raw dataset through the entire pipeline — diagnosis, sizing, training, and
          honest evaluation — the way a practitioner actually works. And the rest of the site is a map of
          where these ideas sit among the other model families: the <Link href="/map" style={link}>curriculum
          atlas</Link> shows what connects to what. Wherever you go, you are no longer memorising architectures.
          You are reading them — as stacks of simple units, each one assembled from decisions you now know how
          to make.
        </p>
        <p>
          That was the whole point. The family closes here, but the way of thinking it gave you does not.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint · the whole family"
          questions={[
            {
              q: <>The family&rsquo;s through-line frames a neural network as one object seen through six
                decisions. What is that object?</>,
              options: [
                "A single large equation that must be solved in closed form",
                "A stack of simple units, where each track answered one decision about the stack — the unit, its training, its nonlinearity, its size, its starting point, and its generalisation",
                "A lookup table that memorises the training data",
              ],
              answer: 1,
              explain: <>Perceptron→MLP built the unit and forward pass; backprop trained it; activations
                chose the nonlinearity; architecture sized it; initialisation and normalisation gave it a
                trainable start; regularisation made it generalise. Six decisions about one stack of simple
                units.</>,
            },
            {
              q: <>Your network trains to near-perfect training accuracy but tests poorly. Which track owns the
                fix, and why?</>,
              options: [
                "Architecture design — the network must be too small",
                "Regularisation — a high-train/low-test result is a generalisation gap, which is exactly what dropout, augmentation, weight decay and early stopping close",
                "Backpropagation — the gradients must be wrong",
              ],
              answer: 1,
              explain: <>High train with low test is the signature of overfitting — a generalisation gap, not a
                capacity or optimisation failure. That is the regularisation track&rsquo;s job: trade a little
                training accuracy for test accuracy, once the gap is confirmed.</>,
            },
            {
              q: <>Across the family, several findings contradicted textbook defaults: depth beyond 2 hurt on
                moons, weight decay was inert while dropout worked, same-kind regularisers interfered. What is
                the habit these are meant to instil?</>,
              options: [
                "Textbooks are always wrong and should be ignored",
                "Trust the measurement over the folklore — decisions about the stack are read off a held-out number, because which choice wins is a property of the problem",
                "Always use dropout and never use weight decay",
              ],
              answer: 1,
              explain: <>None of those results follow from a universal ordering; each came from measuring on the
                actual problem. The competence the family teaches is to localise a fault to a track and then let
                a held-out measurement — not a default — decide the fix.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/the-playbook", label: <>&larr; The regularisation playbook</> }}
          next={{ href: "/learn/perceptron-to-mlp", label: <>Revisit &middot; Perceptron &rarr; MLP &rarr;</> }}
        />
      </div>
    </article>
  );
}
