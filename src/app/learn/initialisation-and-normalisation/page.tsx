import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { INIT_DONE, INIT_TOTAL } from "@/lib/initNormTrack";

export const metadata = {
  title: "Initialisation & normalisation — Manifold",
  description:
    "The starting point decides whether a deep network can learn at all. Where the named initialisations come from, what normalisation actually does, and how the two interact. The fifth track of the neural networks family.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHAPTERS: { name: string; href: string; blurb: string; topics: string }[] = [
  {
    name: "The starting point matters",
    href: "/learn/initialisation-and-normalisation/what-bad-init-looks-like",
    blurb: "Before a single gradient step, the choice of initial weights already decides whether signal survives the forward pass. Watch it vanish and explode.",
    topics: "bad init · the variance argument · breaking symmetry",
  },
  {
    name: "The named initialisations",
    href: "/learn/initialisation-and-normalisation/xavier",
    blurb: "Xavier and He are not magic constants. They are the answer to one variance equation, with a different activation assumption in each.",
    topics: "Xavier / Glorot · He / Kaiming · measured · other schemes",
  },
  {
    name: "Batch normalisation",
    href: "/learn/initialisation-and-normalisation/covariate-shift",
    blurb: "The technique that made very deep networks routine. What it actually does — the original story, and the one the evidence supports.",
    topics: "covariate shift · what it does · affine params · test time",
  },
  {
    name: "Beyond batch normalisation",
    href: "/learn/initialisation-and-normalisation/layer-norm",
    blurb: "BatchNorm breaks with batch size one and with sequences. Layer, group, instance and RMS norm normalise along different axes to fix that.",
    topics: "LayerNorm · group & instance · RMSNorm · which when",
  },
  {
    name: "The interaction",
    href: "/learn/initialisation-and-normalisation/the-interaction",
    blurb: "Init, activation and normalisation are one system. Normalisation is what makes the starting point forgiving — measured across the whole grid.",
    topics: "the three-way grid · reduced sensitivity · modern defaults · playbook",
  },
];

export default function InitNormHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Neural networks", color: CORAL },
          { label: INIT_DONE >= INIT_TOTAL ? `Complete · ${INIT_TOTAL} pages` : `${INIT_DONE} of ${INIT_TOTAL} pages`, color: CORAL },
        ]}
        time="the family's fifth track"
        title={<>The starting point <em>decides everything</em></>}
        intro={<>Three tracks have now left a debt at this door. Backpropagation measured gradient
          ratios in the tens of millions. Activation functions measured saturation at initialisation.
          Architecture design showed a depth-20 network failing even with healthy gradient ratios. All
          three pointed here — to the <strong>weights you start from</strong> and the{" "}
          <strong>normalisation that keeps that start from mattering so much</strong>. This track pays
          the debt.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The claim this track rests on</h2>
        <p>
          <strong>The starting point determines whether the network can learn, and normalisation is
          what makes that starting point less fragile.</strong> A deep network is a long product of
          matrices. If each matrix scales the signal up a little, the product explodes; if each scales
          it down a little, the product vanishes. Initialisation sets that per-layer scale. Normalisation
          resets it after every layer so the scale can never drift far, no matter where you started.
        </p>
        <p>
          This is measurable, and the numbers are violent. In a plain 8-layer ReLU network, initialising
          the weights too small collapses the pre-activation standard deviation from{" "}
          <strong>0.001 to 0.0000 by layer 2</strong> — the signal is gone. Initialising too large sends
          it the other way: layer 1 sits at std <strong>5.2</strong>, and by layer 8 it is{" "}
          <strong>4,197,047,183</strong>. He initialisation, the correct one for ReLU, holds the
          pre-activation std within a factor of two of one across all eight layers.
        </p>

        <Callout color={CORAL} title={<>The version of this you can check</>}>
          Every number in this track comes from <code>scripts/init_norm_cases.py</code>, run on
          python 3.13 / sklearn 1.8 / numpy 2.3. That includes the honest findings: Xavier is the{" "}
          <em>wrong</em> init for ReLU (its variance decays 0.25 → 0.0008 over ten layers while He&rsquo;s
          holds near 0.6), zero initialisation gives a network of effective width one, and normalisation
          buys its stability by making the init scale <em>almost stop mattering</em> — not by making any
          single init better.
        </Callout>

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
          <Link href="/learn/backpropagation" style={link}>Backpropagation</Link> for the chain-rule
          product that init controls one factor of.{" "}
          <Link href="/learn/activation-functions" style={link}>Activation functions</Link> for why the
          activation choice and the init scale have to be chosen together.{" "}
          <Link href="/learn/architecture-design" style={link}>Architecture design</Link> for the depth
          that makes all of this matter — a two-layer network barely notices its initialisation; a
          fifty-layer one lives or dies by it.
        </p>

        <h2>Where it goes next</h2>
        <p>
          This track owns the <strong>other factor of the gradient product</strong> — the one you set by
          initialising and stabilise by normalising. The final track,{" "}
          <Link href="/learn/nn-regularisation" style={link}>Regularisation</Link>, owns the tools that
          close the train–test gap once the network trains cleanly: dropout, weight decay, early stopping.
          BatchNorm turns out to regularise too, and that track says so.
        </p>

        <PrevNext
          prev={{ href: "/learn/architecture-design", label: <>← Architecture design</> }}
          next={{ href: "/learn/initialisation-and-normalisation/what-bad-init-looks-like", label: <>Start · What bad init looks like →</> }}
        />
      </div>
    </article>
  );
}
