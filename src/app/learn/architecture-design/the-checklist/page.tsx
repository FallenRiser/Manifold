import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { DecisionPoint } from "@/components/DecisionPoint";

export const metadata = {
  title: "The architecture checklist — Manifold",
  description:
    "The closing checklist: the go/no-go questions to run whenever you size a network. Does it overfit a small sample? Is width past its plateau? Does the problem have hierarchy? Is the gap real?",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheChecklistPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Putting it together", color: CORAL },
          { label: "Tier 2 · practitioner", color: CORAL },
        ]}
        time="about 6 minutes"
        title={<>The architecture checklist</>}
        intro={
          <>
            You have earned a short list. This is the scannable set of go/no-go questions to run
            whenever you size a network — each one a decision the track taught you to make from a
            measurement rather than a guess. Keep it next to your training loop.
          </>
        }
      />

      <div className="lesson">
        <h2>The go/no-go questions</h2>
        <ol style={{ lineHeight: 1.8 }}>
          <li>
            <strong>Did it overfit a small sample?</strong> If a few dozen examples cannot be driven
            to near-perfect training accuracy, stop — you have a bug or a capacity problem, not an
            architecture to tune (
            <Link href="/learn/architecture-design/the-order-of-operations" style={link}>order of
            operations</Link>).
          </li>
          <li>
            <strong>Is the model underfitting or overfitting?</strong> Read both numbers, not one:
            low-and-close means add capacity; high-and-close means stop; high-train-low-test means a
            real gap (
            <Link href="/learn/architecture-design/underfit-fit-overfit" style={link}>underfit, fit,
            overfit</Link>).
          </li>
          <li>
            <strong>Have you widened before deepening?</strong> Width is the first capacity knob — no
            new gradient bottleneck, local and predictable cost (
            <Link href="/learn/architecture-design/what-width-buys" style={link}>what width
            buys</Link>).
          </li>
          <li>
            <strong>Is width past its plateau?</strong> If another doubling buys less than the noise,
            you are on the plateau — stop widening (
            <Link href="/learn/architecture-design/the-width-plateau" style={link}>the width
            plateau</Link>).
          </li>
          <li>
            <strong>Does the problem actually have a hierarchy?</strong> Add depth only if there are
            features-of-features to compose; otherwise you pay the depth tax for nothing (
            <Link href="/learn/architecture-design/when-depth-hurts" style={link}>when depth
            hurts</Link>).
          </li>
          <li>
            <strong>Is the train-test gap real?</strong> Regularise only a measured gap. A tiny gap
            means there is nothing to close and regularisation will do nothing.
          </li>
          <li>
            <strong>Have you tried the cheapest experiment first?</strong> One change at a time,
            cheapest and most diagnostic first, so every result is interpretable.
          </li>
          <li>
            <strong>Is the ceiling in the data, not the network?</strong> If capacity and
            regularisation have both stopped moving the number, stop tuning the architecture and look
            at the data (
            <Link href="/learn/architecture-design/when-its-not-architecture" style={link}>when the
            architecture is not the problem</Link>).
          </li>
        </ol>

        <Callout color={CORAL} title={<>The one finding to remember</>}>
          If you keep a single number from this track, keep this: at an <em>equal parameter
          budget</em>, wide-shallow beat deep-narrow — <strong>1&times;333 reached 0.953</strong>{" "}
          while <strong>8&times;10 reached 0.944</strong>. Depth is not free capacity; spent
          carelessly it costs accuracy. Start wide, add depth only when the problem&rsquo;s structure
          asks for it, and let the measurement — not the folklore — decide.
        </Callout>

        <h2>What you now have</h2>
        <p>
          You started this track with the question every practitioner asks first — <em>how many
          layers, how many neurons?</em> — and you now have something better than a number. You have a
          procedure: start from a sensible default, prove capacity on a small sample, scale width to
          the plateau, add depth only for genuine hierarchy, reach for skip connections when depth is
          unavoidable, diagnose with the train-test gap, and recognise when the ceiling has moved into
          the data. Every step is anchored to a measurement, so your choices are answers rather than
          guesses.
        </p>
        <p>
          What this track deliberately did not cover is <em>why</em> deep networks are hard to train
          in the first place, and how initialisation and normalisation make depth tractable before you
          ever reach for skip connections. That is the next track. The depth tax you learned to respect
          here — the vanishing and exploding gradients, the rough loss landscapes — is exactly what
          careful initialisation and normalisation are built to tame.
        </p>

        <Proof color={CORAL} title="the whole track in one sentence">
          <p>
            Architecture is a search procedure with priors, not a number: begin from a strong default,
            change one thing at a time in order of cheapness and diagnostic value, and read every
            result off a held-out measurement — because the meaningful search space is only a few
            logarithmic doublings wide, and the data, not the network, sets the final ceiling.
          </p>
        </Proof>

        <DecisionPoint
          accent={CORAL}
          question={<>A tabular model reports <strong>train 0.71, held-out 0.69</strong>. A colleague
            proposes going from 2 hidden layers to 8, on the grounds that the problem &ldquo;probably
            has hierarchical structure&rdquo;. What do you do?</>}
          options={[
            {
              label: "Widen instead — training accuracy is the number that is low",
              verdict: "best",
              response: <>Right, and the reasoning is the whole checklist in one step. A gap of 0.02
                says the model is not failing to generalise, it is failing to <em>fit</em>; that is
                the underfitting panel, and width is the cheap, safe, fast knob for it. On this
                track&rsquo;s own sweep, width bought 18 points before plateauing while depth bought
                3.5 and then nothing.</>,
            },
            {
              label: "Add the depth — hierarchy is a real mechanism",
              verdict: "miss",
              response: <>Hierarchy is real, but it is a property of the <em>data</em>, not something
                depth confers. &ldquo;Probably has hierarchical structure&rdquo; is a hypothesis
                nobody has tested, and the cost of being wrong is not zero: depth is the knob that
                carries the depth tax, and under plain SGD the same family of networks falls from
                0.940 at depth 20 to 0.750 at depth 40. Turn the safe knob first.</>,
            },
            {
              label: "Regularise — the gap will widen once capacity goes up",
              verdict: "miss",
              response: <>This is a treatment for a condition the model does not have. Regularisation
                buys held-out accuracy by spending training accuracy, and there is 0.71 of it here,
                none of it spare. Measured on a network with no gap, L2 moved held-out accuracy
                by &minus;0.005.</>,
            },
            {
              label: "Neither — collect more data first",
              verdict: "close",
              response: <>Rarely wrong as an instinct, and more data is the one intervention that
                helps in almost every cell of the diagnostic square. But it is also the slowest and
                most expensive thing on the list, and this particular pattern — train and held-out
                both low, close together — is the one case where more data is least likely to help,
                because the model cannot fit the data it already has.</>,
            },
          ]}
        />

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>The single most important honest finding of the track concerns spending a fixed
                parameter budget. What is it?</>,
              options: [
                "Deep-narrow always beats wide-shallow at equal budget",
                "At equal budget, wide-shallow beat deep-narrow — 1×333 reached 0.953 while 8×10 reached 0.944 — so depth is not free capacity",
                "Budget does not affect accuracy at all",
              ],
              answer: 1,
              explain: <>Spending the same parameters wide (1×333) reached 0.953; spending them
                deep-narrow (8×10) reached 0.944. Depth spent without a compositional payoff costs
                accuracy, so the default is to start wide and add depth only when the problem&rsquo;s
                structure demands it.</>,
            },
            {
              q: <>According to the checklist, when is the correct answer to &ldquo;should I regularise?&rdquo;
                a no?</>,
              options: [
                "Whenever training accuracy is above 0.9",
                "When the train-test gap is tiny — there is nothing to close, so regularisation does nothing",
                "Whenever the network has more than two layers",
              ],
              answer: 1,
              explain: <>Regularisation is a response to a measured gap. On a problem that barely
                overfits, the gap is already small, so regularisation has nothing to remove — as the
                L2 non-result (0.015 → 0.016) on this track showed.</>,
            },
            {
              q: <>The closing page forwards you to initialisation and normalisation. How does that
                track relate to the depth tax you learned here?</>,
              options: [
                "It replaces the architecture track's advice entirely",
                "It addresses why deep networks are hard to train — the vanishing/exploding gradients and rough landscapes behind the depth tax — and how init and normalisation tame them",
                "It is unrelated to depth",
              ],
              answer: 1,
              explain: <>The depth tax — gradient pathologies and rough loss surfaces — is exactly what
                careful initialisation and normalisation are built to control, making depth tractable
                before you reach for skip connections. That is the subject of the next track.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/when-its-not-architecture", label: <>&larr; When the architecture is not the problem</> }}
          next={{ href: "/learn/initialisation-and-normalisation", label: <>Next track &middot; Initialisation &amp; normalisation &rarr;</> }}
        />
      </div>
    </article>
  );
}
