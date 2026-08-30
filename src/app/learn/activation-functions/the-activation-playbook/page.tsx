import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The activation playbook — Manifold",
  description:
    "The decision procedure, the diagnostics that name a failure from its symptoms, and eleven rules — each one traceable to a measurement on this track.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const RULES: { r: string; why: React.ReactNode }[] = [
  {
    r: "Default to ReLU or GELU in hidden layers, and do not agonise.",
    why: <>Six of seven candidates finished inside a band narrower than their own seed spread. The choice among the
      reasonable options is worth less than one more hour on your data.</>,
  },
  {
    r: "Never use sigmoid in a hidden layer.",
    why: <>Its derivative peaks at exactly 0.25, so twelve layers cost a factor of <M>{String.raw`10^{7}`}</M>. It
      is the one activation on this track that failed outright, at both depths.</>,
  },
  {
    r: "Always use sigmoid or softmax at the output when the task calls for it.",
    why: <>Paired with cross-entropy, the gradient is exactly <M>{String.raw`p - y`}</M> and the 0.25 ceiling
      cancels analytically. The objection to sigmoid is about stacking, not about sigmoid.</>,
  },
  {
    r: "Let the label space choose the output activation. There is no trade-off there.",
    why: <>Regression → identity. Binary → sigmoid. Mutually exclusive classes → softmax. Independent labels →
      per-label sigmoid. Getting this wrong produces a model that trains happily and cannot express the answer.</>,
  },
  {
    r: "Use the fused loss — BCEWithLogitsLoss, CrossEntropyLoss — and output raw logits.",
    why: <>Applying the activation yourself then taking a log overflows on the first confident prediction, often
      hours into a run.</>,
  },
  {
    r: "Count dead units before you touch the learning rate.",
    why: <>A flat loss with zero dead units is a step-size problem. A flat loss with a dead layer cannot be fixed by
      any step size, because <M>{String.raw`\eta \times 0 = 0`}</M>. The two look identical on a loss curve.</>,
  },
  {
    r: "Count dead units per layer, not in total.",
    why: <>19 of 64 spread across the network cost nothing measurable; 16 of 16 in one layer severs the network and
      freezes the loss for 2,000 steps.</>,
  },
  {
    r: "Reach for the leaky family when you have seen deaths, not before.",
    why: <>Leaky ReLU eliminated every death in the measured run and scored 0.0095 <em>below</em> the ReLU run that
      lost 19 units. It fixes a real failure and buys no accuracy on its own.</>,
  },
  {
    r: "Use tanh for recurrent hidden state.",
    why: <>Boundedness is a liability across twelve layers and an asset across two hundred time steps. The property
      did not change; the architecture changed which risk dominates.</>,
  },
  {
    r: "Suspect initialisation and normalisation before you suspect the activation.",
    why: <>The same sigmoid network spanned 29,000,000 to 65 on initialisation scale alone. You are choosing one
      factor of a two-factor product.</>,
  },
  {
    r: "Report the seed spread beside every comparison you make.",
    why: <>Spreads of 0.11 on a small problem mean a single run can demonstrate almost any ordering. This is the
      single most transferable habit on the track.</>,
  },
];

const th: React.CSSProperties = {
  textAlign: "left", padding: "7px 18px 7px 0", color: "var(--muted)", fontWeight: 500,
  borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "7px 18px 7px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top",
};

export default function PlaybookPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Choosing & designing", color: CORAL }, { label: "Tier 2 · reference", color: CORAL }]}
        time="about 9 minutes"
        title={<>The activation playbook</>}
        intro={<>Everything the track measured, compressed into a decision procedure, a symptom table and eleven
          rules. Every rule names the measurement it comes from, so you can check any of them rather than trust
          them.</>}
      />

      <div className="lesson">
        <h2>The decision procedure</h2>
        <p>
          Four questions, in order. Most networks are fully specified by the first two.
        </p>
        <ol>
          <li>
            <strong>What are your labels?</strong> This determines the output activation completely — identity for
            regression, sigmoid for binary, softmax for mutually exclusive classes, per-label sigmoid for
            multi-label. No judgement involved.
          </li>
          <li>
            <strong>Is it a plain feedforward or convolutional network?</strong> Then{" "}
            <strong>ReLU</strong>, or <strong>GELU</strong> if you want the smoother option and can afford the ~25×
            per-element cost. Both are defensible; the measured difference is inside seed noise.
          </li>
          <li>
            <strong>Is it a transformer?</strong> <strong>GELU</strong>, or <strong>SwiGLU</strong> in the
            feedforward block if you are following recent practice. Is it recurrent? <strong>tanh</strong> for the
            state, sigmoid for the gates.
          </li>
          <li>
            <strong>Have you seen a failure?</strong> Only now does the zoo become relevant — and the right entry is
            determined by which failure you measured, per the table below.
          </li>
        </ol>

        <Callout color={CORAL} title={<>What to do if the answer is &ldquo;it is not training&rdquo;</>}>
          Do not start swapping activations. Measure first, in this order:{" "}
          <strong>per-layer gradient norms</strong> (is it a depth problem?), then{" "}
          <strong>dead units per layer</strong> (is the network intact?), then{" "}
          <strong>activation statistics per layer</strong> (are the units in the live region?).
          <br /><br />
          Those three numbers distinguish every failure on this track from every other, and two of the three point
          at initialisation rather than at your choice of curve.
        </Callout>

        <h2>Symptom → cause → fix</h2>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr>
                <th style={th}>symptom</th>
                <th style={th}>measurement</th>
                <th style={th}>cause</th>
                <th style={th}>fix</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>loss flat from step one, early layers unchanged</td>
                <td style={td}>gradient norm falls sharply toward layer 1</td>
                <td style={td}>saturating activation compounding with depth</td>
                <td style={td}>ReLU family or GELU; check the init scale too</td>
              </tr>
              <tr>
                <td style={td}>loss jumps once, then perfectly flat</td>
                <td style={td}>a whole layer dead</td>
                <td style={td}>one huge step killed the layer</td>
                <td style={{ ...td, color: "var(--bad)" }}>restart at a lower rate — lowering it now cannot help</td>
              </tr>
              <tr>
                <td style={td}>loss falls then plateaus above a good value</td>
                <td style={td}>a growing fraction of units dead</td>
                <td style={td}>learning rate too high for ReLU</td>
                <td style={td}>lower the rate, or switch to Leaky/GELU</td>
              </tr>
              <tr>
                <td style={td}>loss to NaN</td>
                <td style={td}>gradient norm exploding</td>
                <td style={td}>init scale or an unbounded activation compounding</td>
                <td style={td}>gradient clipping, smaller init — see{" "}
                  <Link href="/learn/backpropagation/exploding-gradients" style={link}>exploding gradients</Link></td>
              </tr>
              <tr>
                <td style={td}>plateaus early, confident and wrong</td>
                <td style={td}>output gradient small when error is large</td>
                <td style={td}>sigmoid output paired with squared error</td>
                <td style={td}>use cross-entropy — the cancellation is the point</td>
              </tr>
              <tr>
                <td style={td}>multi-label model never predicts two labels</td>
                <td style={td}>outputs sum to 1</td>
                <td style={td}>softmax on a non-exclusive problem</td>
                <td style={td}>independent sigmoids, BCE summed</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>The three-line diagnostic</h2>
        <p>
          Worth adding to any training loop you expect to debug:
        </p>

        <CodeBlock
          language="python"
          fromScratch={`def report(model, X):
    """Per-layer gradient norms, dead-unit counts and activation means --
    the three numbers that distinguish every failure on this track."""
    for i, (g, a) in enumerate(zip(grads, activations)):
        dead = (a <= 0).all(axis=0).sum()          # units off for EVERY row
        print(f"layer {i}: |grad| {np.linalg.norm(g):.2e}  "
              f"dead {dead}/{a.shape[1]}  mean act {a.mean():+.3f}")`}
        />

        <p>
          A gradient norm falling by orders of magnitude toward layer 1 is a depth problem. A dead count near the
          layer width is a severed network. A mean activation far from zero tells you the units are sitting off in a
          tail. You will read those three lines more often than you will read a paper about activations.
        </p>

        <h2>Eleven rules</h2>
        <div style={{ display: "grid", gap: 10, margin: "1.2rem 0" }}>
          {RULES.map((x, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${CORAL}`, borderRadius: 10, padding: "11px 14px" }}>
              <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500, marginBottom: 4 }}>
                <span style={{ color: CORAL, marginRight: 8 }}>{i + 1}</span>{x.r}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{x.why}</div>
            </div>
          ))}
        </div>

        <Callout color={CORAL} title={<>What this track was really about</>}>
          Not a catalogue. The claim was that <strong>an activation is a derivative you are choosing</strong>, and
          the payoff is that you can now look at an unfamiliar function, read two numbers off its derivative, and
          predict what it will do to a twelve-layer network.
          <br /><br />
          The second thing to keep is the proportion. One decision here can destroy a run; the rest are worth
          fractions of a point that a re-seed would swamp.{" "}
          <strong>Distinguishing the catastrophic decision from the cosmetic ones is the skill</strong>, and it is
          the same skill in every other part of this subject.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Final checkpoint"
          questions={[
            {
              q: <>Your loss jumped once at step 3 and has been perfectly flat for 2,000 steps. What do you do?</>,
              options: [
                "Lower the learning rate and continue the run",
                "Count dead units per layer — if a layer is fully dead, restart, because no step size can revive it",
                "Switch to a smaller network",
              ],
              answer: 1,
              explain: <>A flat line after a jump means an exactly-zero gradient. If a layer is severed, lowering the
                rate mid-run changes nothing: the damage happened at step 3 and the parameters are frozen. Restart,
                or use an activation whose slope is never exactly zero.</>,
            },
            {
              q: <>You are choosing between ReLU and GELU for a convolutional network. How much time should this
                take?</>,
              options: [
                "A careful benchmark of both with several seeds",
                "Almost none — pick either; the measured difference is inside seed noise and your time is better spent elsewhere",
                "Choose GELU always, since it is newer",
              ],
              answer: 1,
              explain: <>Six of seven candidates finished inside a band narrower than their own seed spread. Both are
                defensible defaults, and treating this as a tuning decision is exactly the misallocation the track
                is arguing against.</>,
            },
            {
              q: <>Your deep sigmoid network is not training. What is the <em>complete</em> diagnosis?</>,
              options: [
                "Sigmoid vanishes — replace it and move on",
                "The product of per-layer slopes and weights is collapsing; sigmoid caps the slope at 0.25, and the initialisation sets the other factor, which alone spanned six orders of magnitude",
                "The learning rate is too small for a sigmoid network",
              ],
              answer: 1,
              explain: <>Replacing the activation is the right action and an incomplete explanation. The same sigmoid
                network gave ratios of 29,000,000 and 65 under two initialisations — which is why the next track in
                this family is about initialisation and normalisation.</>,
            },
          ]}
        />

        <h2>Where to go next</h2>
        <p>
          The unfinished business of this track is the other factor in that product.{" "}
          <strong>Initialisation &amp; normalisation</strong> owns it, and it is the natural continuation — every
          time this track said &ldquo;and the initialisation matters at least as much&rdquo;, it was deferring to
          there. <strong>Architecture design</strong> takes the other branch: how deep, how wide, and why residual
          connections are an architecture-level answer to a gradient problem.
        </p>
        <p>
          If you want the mechanism behind everything here rather than the choice,{" "}
          <Link href="/learn/backpropagation/vanishing-gradients" style={link}>vanishing gradients</Link> in the
          previous track is where the chain-rule product is opened up in full.
        </p>

        <PrevNext
          prev={{ href: "/learn/activation-functions/designing-a-new-one", label: <>← Designing a new one</> }}
          next={{ href: "/learn/activation-functions", label: <>Back to the track index →</> }}
        />
      </div>
    </article>
  );
}
