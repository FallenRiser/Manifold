import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { ARCH_DONE, ARCH_TOTAL } from "@/lib/architectureTrack";
import { NetworkPair } from "@/components/figures/arch/NetworkDiagram";

export const metadata = {
  title: "Architecture design — Manifold",
  description:
    "How many layers, how many neurons? Answered as a search procedure with priors, not a number. The fourth track of the neural networks family.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHAPTERS: { name: string; href: string; blurb: string; topics: string }[] = [
  {
    name: "The question everyone asks first",
    href: "/learn/architecture-design/what-you-are-choosing",
    blurb: "What you are actually choosing when you pick a depth and a width, and the parameter cost of each choice.",
    topics: "the search · parameters · capacity",
  },
  {
    name: "Width",
    href: "/learn/architecture-design/what-width-buys",
    blurb: "Universal approximation is a width theorem. Width gives you capacity, and capacity plateaus — measured, not asserted.",
    topics: "capacity · approximation · the plateau · when to go wider",
  },
  {
    name: "Depth",
    href: "/learn/architecture-design/what-depth-buys",
    blurb: "Depth buys composition — features built from features. It also buys gradient problems, and there is a measurable crossover.",
    topics: "feature hierarchy · composition · the depth tax · when depth hurts",
  },
  {
    name: "Spending a parameter budget",
    href: "/learn/architecture-design/wide-vs-deep",
    blurb: "Same total parameters, spent two ways. Wide-shallow vs deep-narrow, funnel vs constant width, and what the memory budget says.",
    topics: "budget · the grid · width schedules · memory & compute",
  },
  {
    name: "Fixing depth: skip connections",
    href: "/learn/architecture-design/the-gradient-problem",
    blurb: "The architecture-level answer to the gradient pathology. F(x) + x is the most important three characters in modern deep learning.",
    topics: "the gradient problem · skip connections · residual blocks",
  },
  {
    name: "The diagnostic loop",
    href: "/learn/architecture-design/reading-the-curve",
    blurb: "Learning curves tell you which knob to turn. Underfit, fit, overfit — each has a signature and a remedy.",
    topics: "learning curves · diagnosis · the order of operations · defaults",
  },
  {
    name: "Putting it together",
    href: "/learn/architecture-design/the-playbook",
    blurb: "A playbook, the honest cases where architecture is not the problem, and a checklist you have earned.",
    topics: "the playbook · when it is not architecture · the checklist",
  },
];

export default function ArchitectureDesignHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Neural networks", color: CORAL },
          { label: ARCH_DONE >= ARCH_TOTAL ? `Complete · ${ARCH_TOTAL} pages` : `${ARCH_DONE} of ${ARCH_TOTAL} pages`, color: CORAL },
        ]}
        time="the family's fourth track"
        title={<>Architecture is a search, <em>not a guess</em></>}
        intro={<>&ldquo;How many layers? How many neurons?&rdquo; is the question every learner asks first and
          every course answers last. This track answers it as a <strong>measurement</strong> rather than a
          recipe — because the right answer depends on your data, your budget, and the symptoms your
          current model is showing.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The claim this track rests on</h2>
        <p>
          <strong>Architecture is a search procedure with priors, not a number you look up.</strong>{" "}
          There is no formula that takes a dataset and outputs &ldquo;3 layers, 64 neurons each.&rdquo;
          But there are strong priors — start wider than you think, depth helps less than you think on
          tabular data, and the train/val gap tells you which direction to move — and a search over
          those priors is short and reliable.
        </p>
        <p>
          This track measures that claim. On the problem running through every page here, the{" "}
          <strong>best test accuracy (0.953)</strong> sits at depth 2, width 32 — 1,185 parameters.
          Depth 8 at width 64 uses <strong>29,377 parameters</strong> and scores{" "}
          <strong>0.932</strong>. Twenty-five times the cost for less accuracy. The grid makes that
          visible.
        </p>

        <Callout color={CORAL} title={<>The honest findings, kept in</>}>
          Every number in this track is measured, not asserted, with the protocol stated on each page. That
          includes the findings that do not flatter a bigger network: on this problem, adding depth beyond 2
          does not help, width plateaus at 16, and regularisation does not improve a gap that is already
          0.015.
        </Callout>

        <NetworkPair
          left={{ sizes: [2, 32, 32, 1], title: "The best model in the sweep", note: "0.9530 test accuracy · 1,185 parameters" }}
          right={{ sizes: [2, 64, 64, 64, 64, 64, 64, 64, 64, 1], title: "Twenty-five times the parameters", note: "0.9320 test accuracy · 29,377 parameters" }}
          caption={<>Thirty architectures were trained on one dataset to produce these two. The
            larger network is not a near-miss that needed better tuning; it has 25 times the
            parameters, takes far longer to train, and is two points <em>worse</em>. That is what
            makes architecture a search rather than a guess — the relationship between size and
            accuracy is not monotone, and the only way to know where you are on it is to measure.</>}
        />

        <h2>The seven chapters</h2>
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
          <Link href="/learn/perceptron-to-mlp" style={link}>Perceptron → MLP</Link> for what a layer is
          and what the forward pass does.{" "}
          <Link href="/learn/backpropagation" style={link}>Backpropagation</Link> for gradients and why
          depth makes them misbehave.{" "}
          <Link href="/learn/activation-functions" style={link}>Activation functions</Link> for the factor
          of the gradient product you choose. The skip-connections chapter connects all three.
        </p>

        <h2>Where it goes next</h2>
        <p>
          This track owns <strong>how much network to use</strong>. Initialisation &amp; normalisation
          owns the techniques that let you actually train the deep architectures this track recommends.
          Regularisation owns the tools (dropout, weight decay, early stopping) that close the
          train–test gap this track diagnoses.
        </p>

        <PrevNext
          prev={{ href: "/learn/activation-functions", label: <>← Activation functions</> }}
          next={{ href: "/learn/architecture-design/what-you-are-choosing", label: <>Start · What you are actually choosing →</> }}
        />
      </div>
    </article>
  );
}
