import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { ActivationExplorerLab } from "@/components/labs/ActivationExplorerLab";

export const metadata = {
  title: "The property space — Manifold",
  description:
    "Every activation is a point in a small space of five properties. Learn the axes and you no longer need the names — you can place a function you have never seen and predict what it will do.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const PROPS: { name: string; question: string; matters: string; evidence: string }[] = [
  {
    name: "Gradient behaviour",
    question: "Where is the derivative near zero, and how large does it get?",
    matters: "This is the one that decides whether a deep network trains at all. A peak slope below 1 compounds fatally; an exactly-zero region makes damage permanent.",
    evidence: "sigmoid's 0.25 ceiling → a 29,000,000× collapse over twelve layers. ReLU's exact zero → 19 of 64 units gone in forty steps.",
  },
  {
    name: "Range & centring",
    question: "Is the output bounded? Can it be negative?",
    matters: "Boundedness protects against growth under repeated application and causes saturation at depth — the same property, opposite verdicts. Non-negative outputs force every weight feeding a unit to share a gradient sign.",
    evidence: "100% of weight columns sign-locked for sigmoid and ReLU, 0% for tanh and GELU. tanh is still standard in recurrent state precisely because it is bounded.",
  },
  {
    name: "Smoothness & monotonicity",
    question: "Is there a corner? Does it ever go back down?",
    matters: "Far less than assumed. The kink is measure-zero and harmless; the useful correlate of smoothness is that a smooth function's derivative is never exactly zero.",
    evidence: "GELU and Swish are both non-monotone and both work. Leaky ReLU is non-smooth and shares their immunity to dead units.",
  },
  {
    name: "Cost",
    question: "How much arithmetic per unit per step?",
    matters: "One exp() per unit at every layer at every step, over a training run of weeks, is a real budget line — and the reason hard-swish exists.",
    evidence: "GELU 25.6× ReLU, Swish 22.1×, sigmoid 20.4×, Leaky 2.5×, measured in NumPy on one machine.",
  },
  {
    name: "Parameters",
    question: "Does the function have knobs, and are they learned?",
    matters: "A shape parameter is a hyperparameter that can be wrong. PReLU learns it, SELU derives it, ReLU has none — which is a genuine advantage that is rarely counted.",
    evidence: "PReLU commonly learns α ≈ 0.25, far from the 0.01 convention that Leaky ReLU fixes it at.",
  },
];

export default function PropertySpacePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Choosing & designing", color: CORAL }, { label: "Tier 2 · synthesis", color: CORAL }]}
        time="about 10 minutes"
        title={<>The property space</>}
        intro={<>This is the page the track exists for. Every function in the zoo is a point in a space of five
          properties; the names are labels for points people happened to visit. Learn the axes and you can place a
          function you have never seen, and predict what it will do to your training run.</>}
      />

      <div className="lesson">
        <h2>The five axes</h2>

        <div style={{ display: "grid", gap: 14, margin: "1.4rem 0" }}>
          {PROPS.map((p, i) => (
            <div key={p.name} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${CORAL}`, borderRadius: 12, padding: "14px 16px" }}>
              <div className="font-display" style={{ fontSize: 15, fontWeight: 500, color: CORAL, marginBottom: 3 }}>
                {i + 1}. {p.name}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink)", fontStyle: "italic", marginBottom: 7 }}>{p.question}</div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 7px" }}>{p.matters}</p>
              <div style={{ fontSize: 12.5, color: "var(--faint)", lineHeight: 1.55 }}>
                <strong style={{ color: "var(--muted)" }}>measured: </strong>{p.evidence}
              </div>
            </div>
          ))}
        </div>

        <Callout color={CORAL} title={<>They are not equally weighted</>}>
          Property 1 has a failure mode that costs you the entire run. Properties 2 through 5 are worth fractions of
          a point, and in the bakeoff most of those fractions were inside the seed noise.
          <br /><br />
          So the decision procedure is short: <strong>get property 1 right, then choose among the survivors on cost
          and convenience.</strong> Almost all the writing about activations — this track&rsquo;s included — is
          about properties 2 to 5, which is a poor reflection of where the value is.
        </Callout>

        <h2>Placing a function you have not seen</h2>
        <p>
          Take an activation you have never met — say <M>{String.raw`f(x) = x\,\tanh(\text{softplus}(x))`}</M>. You
          do not need to know it is called Mish. Three questions, answerable in a minute:
        </p>
        <ul>
          <li><strong>Peak slope?</strong> Measure it, or reason it out: this is{" "}
            <M>{String.raw`x \cdot g(x)`}</M> with a soft gate, so the product rule gives a slope slightly above 1.
            <em> No compounding ceiling — property 1 is safe.</em></li>
          <li><strong>Exactly zero anywhere?</strong> Both factors are smooth and{" "}
            <M>{String.raw`\tanh(\text{softplus}(x)) \to 0`}</M> only asymptotically.{" "}
            <em>No permanent deaths.</em></li>
          <li><strong>Cost?</strong> An exponential, a log and a tanh per unit.{" "}
            <em>Expensive — 17× ReLU as measured.</em></li>
        </ul>
        <p>
          Conclusion in one line: it is a Swish-class function, safe at depth, slower than the alternatives, and any
          reported advantage over Swish should be checked against seed noise before you believe it. That is the whole
          skill, and it did not require knowing the name.
        </p>

        <LabFrame
          accent={CORAL}
          tryThis={<>Pick two activations that look similar on the top panel and compare their lower panels and their
            three readouts. Then do the reverse — find two that look different on top and behave nearly identically
            underneath.</>}
          insight={<>The pair worth finding is <strong>Swish and Mish</strong>: peak slopes of 1.100 and 1.088,
            saturated fractions of 11.4% and 11.3%. On every axis that this track has shown to matter they are the
            same function. Then compare <strong>softplus and ReLU</strong>, which look like near-neighbours on top —
            and note that softplus saturates on 21.3% of the range where ReLU has an exact zero on 50%: similar
            curves, completely different failure modes.</>}
        >
          <ActivationExplorerLab />
        </LabFrame>

        <h2>The interactions worth knowing</h2>
        <p>
          The properties are not independent of the rest of your setup, and three couplings are worth carrying:
        </p>
        <p>
          <strong>Normalisation weakens properties 1 and 2.</strong> Batch or layer norm re-centres and rescales
          activations between layers, which keeps units in the live region of whatever curve you chose and removes
          the sign-coupling from non-negative outputs. In a normalised network, most of this page matters less — and
          that is not a criticism of the page, it is the reason normalisation is worth its cost.
        </p>
        <p>
          <strong>Adam weakens the magnitude part of property 1.</strong> Per-parameter adaptive step sizes partly
          compensate for a gradient that is uniformly small — though not for one that vanishes exponentially with
          depth, which is why sigmoid still failed in a bakeoff run entirely under Adam.
        </p>
        <p>
          <strong>Architecture can substitute for the activation.</strong> Residual connections give the gradient a
          path that skips the activation entirely, which is an architecture-level answer to a property-1 problem.
          That is a large part of why very deep modern networks are less sensitive to this choice than the
          measurements on this track would suggest.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Which property should you check first when choosing an activation, and why?</>,
              options: [
                "Cost, because it is paid every step",
                "Gradient behaviour, because it is the only one whose failure mode costs the entire run",
                "Zero-centring, because it affects convergence speed",
              ],
              answer: 1,
              explain: <>A peak slope below 1 compounds fatally with depth and an exactly-zero region makes damage
                permanent. The other four properties are worth fractions of a point, most of which fell inside the
                seed noise in the measured bakeoff.</>,
            },
            {
              q: <>Boundedness disqualifies tanh from deep feedforward hidden layers and qualifies it for LSTM state.
                What does that show about the property space?</>,
              options: [
                "That the analysis is inconsistent",
                "That properties are not good or bad in themselves — the architecture decides which risk dominates",
                "That tanh is a special case",
              ],
              answer: 1,
              explain: <>Twelve layers make saturation the danger; two hundred recurrent steps make unbounded growth
                the danger. Same property, opposite verdict, because the question changed.</>,
            },
            {
              q: <>Why does adding batch normalisation reduce how much the activation choice matters?</>,
              options: [
                "Because it replaces the activation function",
                "Because it re-centres and rescales activations between layers, keeping units in the live region and removing the sign-coupling of non-negative outputs",
                "Because it makes the network shallower in effect",
              ],
              answer: 1,
              explain: <>Normalisation directly addresses properties 1 and 2 — where units sit on the curve, and
                what their mean is. It does not repair an exactly-zero derivative once a unit is dead, which is why
                the ReLU family's failure mode survives it.</>,
            },
          ]}
        />

        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          The next page handles the one case where none of these five axes apply, because the choice is not yours to
          make:{" "}
          <Link href="/learn/activation-functions/the-output-layer" style={link}>the output layer</Link>.
        </p>

        <PrevNext
          prev={{ href: "/learn/activation-functions/the-bakeoff", label: <>← The bakeoff</> }}
          next={{ href: "/learn/activation-functions/the-output-layer", label: <>Next up · The output layer is a different question →</> }}
        />
      </div>
    </article>
  );
}
