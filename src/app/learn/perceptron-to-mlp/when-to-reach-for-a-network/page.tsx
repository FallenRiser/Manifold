import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "When to reach for a network — Manifold",
  description:
    "The decision procedure, the six sentences the whole track reduces to, and an honest map of what the next five tracks in this family exist to fix.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const NEXT: { name: string; href?: string; blurb: string }[] = [
  {
    name: "Backpropagation & training",
    blurb: "How ∇L is actually computed — one backward sweep instead of one forward pass per parameter. Every gradient this track invoked is owed to that track.",
  },
  {
    name: "Activation functions",
    blurb: "The zoo, as a space of properties rather than a list of names: saturation, zero-centring, smoothness, cost — and how to choose, or design, from requirements.",
  },
  {
    name: "Architecture design",
    blurb: "How deep, how wide, and what to apply when — the directed search that the capacity ladder only hinted at.",
  },
  {
    name: "Initialisation & normalisation",
    blurb: "Why the starting weights decide whether a deep network trains at all, and what normalisation is really stabilising.",
  },
  {
    name: "Regularisation",
    blurb: "Dropout, weight decay and early stopping — how to buy the reliability of an oversized network without paying for its overfitting.",
  },
];

export default function WhenToReachPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "What networks are and are not", color: CORAL }, { label: "Tier 2 · practice", color: CORAL }]}
        time="about 7 minutes"
        title={<>When to reach for a network</>}
        intro={<>The end of the track, and the part worth keeping. Not a summary of what was covered — the decision
          you will actually face, and the six sentences everything here reduces to.</>}
      />

      <div className="lesson">
        <h2>The procedure</h2>
        <p>
          You have a dataset and a target. In order, and stopping as soon as you have your answer:
        </p>
        <ol>
          <li><strong>Get a baseline.</strong> Majority class, or the mean. Any score is meaningless until you know
            what doing nothing scores.</li>
          <li><strong>Fit a linear model.</strong> Seconds of work. If it is already near the ceiling — as on the
            digits, 0.9722 against a network&rsquo;s 0.9741 — you are done choosing models, and every further hour
            belongs in error analysis or in the data.</li>
          <li><strong>Fit a tree ensemble.</strong> Also minutes, also needs no scaling. If it beats the linear
            model substantially, the structure is non-linear and worth pursuing. On tabular data this is very often
            where you stop: the forest claimed 94% of the available headroom against the network&rsquo;s 64%.</li>
          <li><strong>Now consider a network</strong> — and only now. It is the right reach when the inputs are raw
            and unengineered, when the useful feature is one nobody can articulate, when you have data in quantity,
            or when you need a learned representation to reuse.</li>
        </ol>
        <p>
          The ordering is the content. Each step is cheaper than the next and each one either answers the question
          or narrows it — which is the same discipline as{" "}
          <Link href="/learn/data-workflow/start-with-a-baseline" style={link}>starting with a baseline</Link>{" "}
          and the same reason the ten-example test comes before a learning-rate sweep.
        </p>

        <Callout color={CORAL} title={<>The version to remember</>}>
          <strong>Reach for a network when the features have to be learned.</strong> That single criterion accounts
          for all three measured cases in this track: spirals (features must be constructed — network wins by
          0.3733), digits (features already linear — network wins by 0.0019), tabular (features are already the
          concepts of interest — network loses). It is also why images, audio and language are network territory:
          a pixel is not a feature, and neither is a character.
        </Callout>

        <h2>The six sentences</h2>
        <p>
          If everything else fades, these should not.
        </p>
        <ol>
          <li><strong>A neuron is a linear model with a switch.</strong> Weights, a bias, and a choice about what
            the total means. The geometry lives in the weighted sum; the switch only re-interprets it.</li>
          <li><strong>One neuron draws a flat boundary, and some problems have none.</strong> XOR is four points, no
            noise, and provably impossible — a limit of the hypothesis class, which no quantity of data
            addresses.</li>
          <li><strong>Stacking alone buys nothing.</strong> Without a non-linearity, 1,761 parameters collapse to 5
            and agree to four parts in ten trillion. Depth needs the bend.</li>
          <li><strong>A hidden layer is feature engineering, fitted rather than guessed.</strong> It moves the
            points until a line works. The output layer is always a plain linear model on whatever it built.</li>
          <li><strong>A loss is what makes learning possible.</strong> The perceptron rule cannot rank two models,
            so it cannot stop, cannot keep its best attempt, and oscillates forever on data that is not separable.
            One number fixes all of it — at the price of a non-convex landscape.</li>
          <li><strong>Expressiveness is never the constraint.</strong> Universal approximation guarantees a
            representation exists; it promises nothing about finding it, affording it, or generalising from it.
            When a network underperforms, look at optimisation, data and generalisation instead.</li>
        </ol>

        <h2>What this track deliberately left open</h2>
        <p>
          Several times we invoked something and declined to open it. Those were not omissions — each is the subject
          of a track in this family.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))", gap: 14, margin: "1.2rem 0" }}>
          {NEXT.map((c) => (
            <div key={c.name} className="gcard" style={{ ["--accent" as string]: CORAL, display: "block", padding: "14px 16px" }}>
              <div className="font-display" style={{ fontSize: 15, fontWeight: 500, color: CORAL, marginBottom: 4 }}>{c.name}</div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{c.blurb}</p>
            </div>
          ))}
        </div>

        <p>
          Read in order they answer a single question that this track has been circling: given that a network is the
          right tool, <em>how do you get one to actually work?</em> Backpropagation makes training possible;
          activations decide whether the gradient survives the trip; architecture decides how much model there is;
          initialisation and normalisation decide whether a deep one starts at all; regularisation decides whether
          what you get generalises.
        </p>

        <h2>A last word on the reputation</h2>
        <p>
          Neural networks are simultaneously the most over- and under-rated tool in machine learning. Over-rated,
          because on the spreadsheet-shaped problems most people have, a forest usually wins with a fraction of the
          effort and none of the decisions. Under-rated, because on problems where the representation must be
          learned they did not merely improve the state of the art — they created capabilities that did not
          previously exist.
        </p>
        <p>
          Nothing in this track is a reason to be impressed or unimpressed. It is a reason to be able to tell which
          problem is in front of you, which is a more useful thing to carry than an opinion.
        </p>

        <Quiz
          accent={CORAL}
          title="Final checkpoint"
          questions={[
            {
              q: <>You have 3,000 rows, fifteen well-understood columns, and a linear model scoring 0.71 against a
                0.65 baseline. What is the next step?</>,
              options: [
                "A neural network — there is clearly non-linear structure to capture",
                "A tree ensemble, which needs no scaling and fits threshold rules directly",
                "Collect more data before modelling further",
              ],
              answer: 1,
              explain: <>Spreadsheet-shaped data at this size is tree territory, and a forest costs you nothing in
                scaling, architecture or learning rate. Only if it also stalls near 0.71 is the structure genuinely
                exotic enough to make a network the interesting bet.</>,
            },
            {
              q: <>What is the single criterion that separates all three measured cases in this track?</>,
              options: [
                "How much training data was available",
                "Whether the useful features already exist in the columns or must be constructed",
                "Whether the problem was a classification problem",
              ],
              answer: 1,
              explain: <>Spirals: constructed, network wins by 0.3733. Digits: already linear, +0.0019. Tabular: the
                columns are the concepts, network loses. All three were classification, and data size does not order
                them — the spirals had the fewest rows and the largest network win.</>,
            },
            {
              q: <>A colleague says universal approximation proves a big enough network will solve their problem.
                What is wrong with that?</>,
              options: [
                "Nothing — it is exactly what the theorem says",
                "The theorem promises a representation exists; it says nothing about finding it, affording it, or generalising from it",
                "The theorem only applies to sigmoid activations",
              ],
              answer: 1,
              explain: <>Existence is not reachability. Training is non-convex — two hidden units solved XOR from
                only 25 of 50 seeds — the constructive width can be astronomically large, and a model wide enough to
                approximate anything is wide enough to interpolate noise. The theorem holds for any non-polynomial
                activation.</>,
            },
            {
              q: <>Without a non-linearity, what is a 50-layer network equivalent to?</>,
              options: [
                "A 50-layer network with reduced capacity",
                "A single linear layer — exactly, not approximately",
                "A network with roughly half the effective depth",
              ],
              answer: 1,
              explain: <>The matrices multiply out into one matrix and the biases fold into one vector. Measured on
                a real 1,761-parameter stack, the deep version and its 5-parameter equivalent differed by{" "}
                <M>{String.raw`4\times10^{-13}`}</M> — floating-point noise.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/where-an-mlp-loses", label: <>← Where an MLP loses</> }}
          next={{ href: "/learn/perceptron-to-mlp", label: <>Back to the track index →</> }}
        />
      </div>
    </article>
  );
}
