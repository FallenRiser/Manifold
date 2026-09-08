import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { PM_DONE, PM_TOTAL } from "@/lib/perceptronMlpTrack";

export const metadata = {
  title: "Perceptron → multilayer perceptron — Manifold",
  description:
    "A neuron is a linear model with a switch, and stacking them buys features you never designed. The first track of the neural networks family: the unit, the stack, the forward pass, and what a network genuinely is and is not.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHAPTERS: { name: string; href: string; blurb: string; topics: string }[] = [
  {
    name: "The unit",
    href: "/learn/perceptron-to-mlp/the-perceptron",
    blurb: "One neuron, taken apart. The oldest learning rule in the field, the guarantee it comes with, and the exact assumption that guarantee quietly requires.",
    topics: "the neuron · the perceptron · the learning rule · what it misses",
  },
  {
    name: "One neuron is not enough",
    href: "/learn/perceptron-to-mlp/the-xor-problem",
    blurb: "Four points that ended an era, the bend that fixes them, and the one-line argument for why a network without activations is not a network.",
    topics: "XOR · two layers · hidden units as features · the collapse",
  },
  {
    name: "The forward pass",
    href: "/learn/perceptron-to-mlp/a-layer-is-a-matrix-multiply",
    blurb: "From a picture of circles and arrows to the four lines of arithmetic it actually is — including the shapes, which are where the bugs live.",
    topics: "matrix form · shapes · output layers · a pass by hand",
  },
  {
    name: "Making it learn",
    href: "/learn/perceptron-to-mlp/from-the-rule-to-a-loss",
    blurb: "Swap the 1950s rule for a loss and a gradient, watch capacity change the boundary in front of you, and meet the failures that look like bugs but aren't.",
    topics: "loss · the training loop · capacity · what goes wrong",
  },
  {
    name: "What networks are and are not",
    href: "/learn/perceptron-to-mlp/universal-approximation",
    blurb: "The famous theorem and the much smaller thing it actually promises, why the same function has astronomically many spellings, then two measured cases — one where a network is transformative and one where it loses to a forest.",
    topics: "universal approximation · no single best weights · where it wins · where it loses · when to reach",
  },
];

export default function PerceptronMlpHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Neural networks", color: CORAL },
          { label: PM_DONE >= PM_TOTAL ? `Complete · ${PM_TOTAL} pages` : `${PM_DONE} of ${PM_TOTAL} pages`, color: CORAL },
        ]}
        time="the family's first track"
        title={<>A neuron is a linear model <em>with a switch</em></>}
        intro={<>Neural networks have a reputation for being a different kind of thing — biological, mysterious,
          requiring new intuition. They are not. If you understand logistic regression, you already understand one
          neuron completely. Everything else in this track is what happens when you connect them.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The claim this track rests on</h2>
        <p>
          <strong>Stacking linear models buys you features you never designed.</strong> That sentence is the whole
          track, and it has two halves that most treatments run together. The first half is <em>why one is not
          enough</em> — a single unit draws a straight line through the world and there are problems, including one
          with four data points, where no straight line will do. The second half is <em>why stacking helps at all</em>,
          which is less obvious than it looks: stack linear maps and you get a linear map, so the stacking alone
          buys nothing. The bend has to come from somewhere.
        </p>
        <p>
          Get those two halves and the rest of deep learning is engineering: bigger stacks, better-behaved bends,
          smarter ways of computing the same gradient. Miss them and you are memorising architectures.
        </p>

        <Callout color={CORAL} title={<>The version of this you can check</>}>
          Take a network with three hidden layers and 1,761 parameters, remove the activation functions, and
          multiply the weight matrices out by hand. The result is a single 4→1 linear map with{" "}
          <strong>5 parameters</strong>, and over 500 inputs the two disagree by{" "}
          <strong>4×10<sup>−13</sup></strong> — floating-point noise. On two moons, that same activation-free
          64–64 network scores <strong>0.8571</strong>, which is <em>exactly</em> what plain logistic regression
          scores on the same split. Turn one activation function back on: <strong>0.9143</strong>.
        </Callout>

        <h2>How this track teaches</h2>
        <p>
          It arrives at the same fact twice, on purpose. Once <strong>geometrically</strong> — you will try to
          separate four points with a line and fail, and then watch a hidden layer move the points until a line
          works. Once <strong>algebraically</strong> — you will watch a three-layer stack draw a perfectly straight
          line no matter how many times you re-roll its weights. These are the same fact. Most readers only believe
          it after both.
        </p>
        <p>
          Training is treated the way you already know how to treat it: a loss and gradient descent. <em>How</em> the
          gradient is computed through several layers is the next track&rsquo;s entire subject, and opening that
          machinery here would bury the geometry under bookkeeping.
        </p>

        <h2>The five chapters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))", gap: 14, margin: "1.2rem 0" }}>
          {CHAPTERS.map((c) => (
            <Link key={c.name} href={c.href} className="gcard" style={{ ["--accent" as string]: CORAL, display: "block", textDecoration: "none", padding: "14px 16px" }}>
              <div className="font-display" style={{ fontSize: 15.5, fontWeight: 500, color: CORAL, marginBottom: 4 }}>{c.name}</div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 8px" }}>{c.blurb}</p>
              <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>{c.topics}</div>
            </Link>
          ))}
        </div>

        <h2>What you should already have</h2>
        <p>
          <Link href="/learn/logistic-regression" style={link}>Logistic regression</Link> is the single most useful
          prerequisite — a neuron with a sigmoid on the end <em>is</em> logistic regression, and knowing that saves
          you from treating half of this track as new.{" "}
          <Link href="/learn/linear-regression/descent-on-the-surface" style={link}>Gradient descent</Link> is assumed from
          chapter 4 onward. The linear-algebra pages in{" "}
          <Link href="/learn/math-foundations" style={link}>Math foundations</Link> cover the matrix shapes, though
          the forward-pass chapter re-derives what it needs.
        </p>

        <h2>Where it goes next</h2>
        <p>
          This track owns the <strong>unit</strong>, the <strong>stack</strong> and the <strong>forward pass</strong>.
          Backpropagation owns how the gradient is actually computed. Activation functions owns the zoo of bends and
          how to choose between them. Architecture design owns how wide and how deep. Each of those is a separate
          track in this family, and each assumes this one.
        </p>

        <h2>Every number here is measured</h2>
        <p>
          Every figure quoted in this track is measured, not asserted, with the protocol stated on the page. That
          includes the unflattering ones: on 8×8 handwritten digits a neural network beats logistic regression by{" "}
          <strong>0.0019</strong>, and on a tabular task a random forest beats it outright. Those numbers are here
          because a track that only shows the wins teaches you to reach for the wrong tool.
        </p>

        <PrevNext
          prev={{ href: "/map", label: <>← The map</> }}
          next={{ href: "/learn/perceptron-to-mlp/the-perceptron", label: <>Start · The perceptron →</> }}
        />
      </div>
    </article>
  );
}
