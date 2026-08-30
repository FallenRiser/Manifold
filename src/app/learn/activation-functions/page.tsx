import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { ACT_DONE, ACT_TOTAL } from "@/lib/activationsTrack";

export const metadata = {
  title: "Activation functions — Manifold",
  description:
    "An activation is a derivative you are choosing. The curve is the half everyone draws; the slope is the half backpropagation multiplies — and it decides whether your network learns at all.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHAPTERS: { name: string; href: string; blurb: string; topics: string }[] = [
  {
    name: "What an activation is for",
    href: "/learn/activation-functions/the-non-negotiable",
    blurb: "The one property that is not negotiable, the half of the picture nobody draws, and the single measurement that predicts every failure in the rest of the track.",
    topics: "non-linearity · the derivative · saturation",
  },
  {
    name: "The squashing era",
    href: "/learn/activation-functions/the-step",
    blurb: "The step that could not be trained, the sigmoid that replaced it, tanh's one real advantage, and what happened to both when networks got deep.",
    topics: "step · sigmoid · tanh & zero-centring · depth",
  },
  {
    name: "The ReLU family",
    href: "/learn/activation-functions/relu",
    blurb: "The function that unlocked depth by being almost nothing, the failure mode it introduced, and four attempts to patch that failure — one of which fails worse.",
    topics: "ReLU · dying ReLU · leaky, PReLU, ELU · SELU",
  },
  {
    name: "The smooth moderns",
    href: "/learn/activation-functions/gelu-and-swish",
    blurb: "What the transformer era actually runs on, what smoothness buys, the rest of the zoo in one page — and then the measured bakeoff that puts all of it in proportion.",
    topics: "GELU & Swish · smoothness · the zoo · the bakeoff",
  },
  {
    name: "Choosing & designing",
    href: "/learn/activation-functions/the-property-space",
    blurb: "The properties behind every name, why the output layer is a different question entirely, how to derive a new activation from requirements, and the decision procedure.",
    topics: "the property space · output layer · designing one · the playbook",
  },
];

export default function ActivationsHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Neural networks", color: CORAL },
          { label: ACT_DONE >= ACT_TOTAL ? `Complete · ${ACT_TOTAL} pages` : `${ACT_DONE} of ${ACT_TOTAL} pages`, color: CORAL },
        ]}
        time="the family's third track"
        title={<>Activation functions</>}
        intro={<>Every course gives you the same table of curves and asks you to remember which is which. That table
          is the least useful thing about the subject. What you actually need is the ability to look at a stuck
          training run and name <em>which property</em> of your activation caused it.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The claim this track rests on</h2>
        <p>
          <strong>An activation is a derivative you are choosing.</strong> The curve is what gets printed in the
          textbook; the slope is what backpropagation multiplies, thirteen times over, on its way back to the first
          layer. Choose a function whose slope is 0.25 at its very best and you have chosen to divide the gradient by
          four at every layer. Nothing else about the curve can rescue that decision.
        </p>
        <p>
          Read that way, the zoo stops being a list to memorise. Every named function is a different answer to two
          questions: <em>where is the slope allowed to be zero</em>, and <em>how large may it get</em>. Sigmoid says
          &ldquo;zero almost everywhere, and never above a quarter&rdquo;. ReLU says &ldquo;exactly zero on half the
          line, exactly one on the other&rdquo;. Leaky ReLU says &ldquo;never exactly zero anywhere&rdquo;. Those are
          engineering decisions with measurable consequences, and this track measures them.
        </p>

        <Callout color={CORAL} title={<>Three numbers that set up the whole track</>}>
          In one twelve-layer network, with identical weights and identical data, changing only the activation moves
          the gradient reaching the first layer by a factor of <strong>29 million</strong> (sigmoid) versus{" "}
          <strong>1.6</strong> (tanh) versus <strong>0.26</strong> (ReLU).
          <br /><br />
          And then the honest complication that the rest of the track has to live with: leaving the activation as
          sigmoid and changing only the <em>initialisation scale</em> moves that same 29 million down to{" "}
          <strong>65</strong>. The activation is one factor in a product. It is not the only one.
          <br /><br />
          Every figure on this track comes from <code>scripts/activation_cases.py</code>.
        </Callout>

        <h2>What this track will not do</h2>
        <p>
          It will not tell you that a particular activation is the best one, because on the evidence here that claim
          is not supportable. In a five-seed bakeoff — same data, same network, same optimiser, swap only the curve —
          six of the seven candidates finish inside a band narrower than their own seed-to-seed spread. One of them,
          sigmoid, is <M>{String.raw`\approx 0.3`}</M> behind everything else and is not in the conversation.
        </p>
        <p>
          That is the real shape of the subject: <strong>one decision that can destroy a run, and then a set of
          reasonable options between which the difference is small enough to be dominated by your architecture, your
          data and your normalisation.</strong> Knowing which of those two situations you are in is the skill.
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
          <Link href="/learn/backpropagation" style={link}>Backpropagation</Link> is the direct prerequisite. This
          track is about one factor in the chain-rule product, so you need to know that the product exists and why
          multiplying twelve small numbers is fatal.{" "}
          <Link href="/learn/perceptron-to-mlp" style={link}>Perceptron → MLP</Link> supplies the rest: what a unit
          is, and why a network without a non-linearity collapses to a single linear map.
        </p>

        <h2>Where the boundaries are</h2>
        <p>
          Backpropagation owns the gradient pathologies <em>as pathologies</em>; this track owns the factor of the
          product that you get to choose, and is honest that{" "}
          <strong>Initialisation &amp; normalisation</strong> owns a factor at least as large.{" "}
          <strong>Architecture design</strong> owns depth and width. The softmax appears here only as a consequence
          of choosing a loss — it is treated in full in{" "}
          <Link href="/learn/logistic-regression" style={link}>Logistic regression</Link>.
        </p>

        <PrevNext
          prev={{ href: "/learn/backpropagation/the-backprop-playbook", label: <>← Backpropagation</> }}
          next={{ href: "/learn/activation-functions/the-non-negotiable", label: <>Start · Non-linear, or nothing →</> }}
        />
      </div>
    </article>
  );
}
