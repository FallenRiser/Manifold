import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { BP_DONE, BP_TOTAL } from "@/lib/backpropTrack";

export const metadata = {
  title: "Backpropagation & training — Manifold",
  description:
    "Backpropagation is the chain rule, organised so that nothing is computed twice. The algorithm, the arithmetic by hand, and the training failures that stop being mysterious once you can see gradients per layer.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHAPTERS: { name: string; href: string; blurb: string; topics: string }[] = [
  {
    name: "The problem",
    href: "/learn/backpropagation/the-cost-of-a-gradient",
    blurb: "Why getting a gradient is the hard part, what the obvious method costs, and the one calculus identity that makes a better method possible.",
    topics: "the cost · the chain rule · the computational graph",
  },
  {
    name: "The algorithm",
    href: "/learn/backpropagation/the-backward-pass",
    blurb: "The backward pass in full, worked by hand on thirteen parameters, then written once in matrix form — the reuse argument that explains the speed, and the memory bill that pays for it.",
    topics: "the backward pass · by hand · four equations · why it is cheap · the memory bill",
  },
  {
    name: "Doing it for real",
    href: "/learn/backpropagation/writing-it-from-scratch",
    blurb: "Sixty lines of NumPy, the check that proves they are right, what a framework does instead, and the four bugs everyone writes at least once.",
    topics: "from scratch · gradient checking · autodiff · bugs",
  },
  {
    name: "Training dynamics",
    href: "/learn/backpropagation/the-learning-rate",
    blurb: "The gradient tells you a direction, not a distance. Everything that decides how far to go — and how far to go later — measured on one problem.",
    topics: "learning rate · schedules · batch size · momentum & Adam · saddles",
  },
  {
    name: "When gradients misbehave",
    href: "/learn/backpropagation/vanishing-gradients",
    blurb: "A gradient that shrinks 29-million-fold on its way back, the same mechanism running the other way, and why depth was out of reach for two decades.",
    topics: "vanishing · exploding & clipping · the history · the playbook",
  },
];

export default function BackpropHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Neural networks", color: CORAL },
          { label: BP_DONE >= BP_TOTAL ? `Complete · ${BP_TOTAL} pages` : `${BP_DONE} of ${BP_TOTAL} pages`, color: CORAL },
        ]}
        time="the family's second track"
        title={<>Backpropagation</>}
        intro={<>The algorithm that made neural networks trainable is a first-year calculus identity applied
          carefully. It is not deep, and it is not clever. What it is, is <em>cheap</em> — and the entire history
          of the field turns on that one word.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The claim this track rests on</h2>
        <p>
          <strong>Backpropagation is the chain rule, organised so that nothing is computed twice.</strong> That is
          the whole algorithm. The mathematics is <M>{String.raw`\frac{dz}{dx} = \frac{dz}{dy}\cdot\frac{dy}{dx}`}</M>,
          which you have known for years. The contribution is entirely in the organisation.
        </p>
        <p>
          To see why organisation is worth a track, consider the obvious alternative. To find how the loss responds
          to one weight, nudge that weight and re-run the network. Do it for every weight. That works, it is easy to
          write, and it is correct — and on the <em>smallest</em> network in this track it is already{" "}
          <strong>1,251 times slower</strong> than the alternative, with the gap widening as the network grows.
          A modern model has billions of parameters; the naive method is not slow there, it is impossible.
        </p>

        <Callout color={CORAL} title={<>What we measured</>}>
          A 2–32–32–1 network with 1,185 parameters, on 200 examples. One backward sweep:{" "}
          <strong>0.32 ms</strong>. The same gradient by nudging each parameter in turn:{" "}
          <strong>402 ms</strong>. Both give the same answer — they agree to a relative difference of{" "}
          <strong>9 × 10<sup>−10</sup></strong>. One of them scales. Real runs, in{" "}
          <code>scripts/backprop_cases.py</code>.
        </Callout>

        <h2>The half nobody advertises</h2>
        <p>
          The second half of this track is the part that pays off for years. Once you can compute a gradient, you
          can <em>look</em> at one — and training failures that felt like bad luck turn into things you can measure.
        </p>
        <p>
          A network with twelve sigmoid layers has a gradient at its first layer that is{" "}
          <strong>29 million times smaller</strong> than at its last. That is not a metaphor about signals fading;
          it is a number you can print, and it explains precisely why the early layers of that network never learn
          anything. Change one argument to ReLU and the ratio becomes 0.255. Change the initialisation scale instead
          and it drops from 29 million to 65 — which tells you the popular slogan is only half the story.
        </p>
        <p>
          Every mysterious training failure in the previous track — the flat loss, the dead units, the model that
          scored exactly the majority-class rate — becomes diagnosable here.
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
          <Link href="/learn/perceptron-to-mlp" style={link}>Perceptron → MLP</Link> is the direct prerequisite —
          this track assumes you can write a forward pass and know why the output activation is decided by the task.
          The chain rule is re-derived from scratch, so calculus beyond &ldquo;a derivative is a slope&rdquo; is not
          assumed; the{" "}
          <Link href="/learn/math-foundations" style={link}>Math foundations</Link> calculus strand is the reference
          if you want more.
        </p>

        <h2>Where the boundaries are</h2>
        <p>
          This track covers the optimisation you need to <em>read a training run</em> — learning rate, batch size,
          momentum, Adam — and stops there; the full treatment of optimisers belongs to the Optimization pillar.
          It <em>diagnoses</em> vanishing and exploding gradients but does not fix them:{" "}
          <strong>Initialisation &amp; normalisation</strong> owns the fixes, and{" "}
          <strong>Activation functions</strong> owns the choice of bend. Reading those three in order is the
          intended path, and this is the one that tells you why the other two exist.
        </p>

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/when-to-reach-for-a-network", label: <>← Perceptron → MLP</> }}
          next={{ href: "/learn/backpropagation/the-cost-of-a-gradient", label: <>Start · The cost of a gradient →</> }}
        />
      </div>
    </article>
  );
}
