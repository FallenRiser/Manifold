import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Dropout rate and where to apply it — Manifold",
  description:
    "The full rate sweep, measured: gains rise to p=0.5 (test 0.777) then fall as too much capacity is removed. Practical defaults, where to place dropout, why not on inputs, and how it interacts with BatchNorm.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DropoutRatePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dropout", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 7 minutes"
        title={<>Dropout rate and where to apply it</>}
        intro={<>Dropout has exactly one hyperparameter — the drop probability <M>{String.raw`p`}</M> —
          and one placement decision: which layers get it. Both have answers you can read off a measured
          sweep rather than guess. Here is the sweep, and here is where the dial should sit.</>}
      />

      <div className="lesson">
        <h2>The rate sweep, measured</h2>
        <p>
          Same overfitting network as the rest of this track — a 3&times;256 MLP on 250 noisy points, full-batch
          AdamW, 400 epochs, three seeds averaged. Train accuracy is pinned at 1.000 at every rate; only the
          test accuracy and the resulting gap move.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>drop rate p</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test accuracy</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>train − test gap</th>
              </tr>
            </thead>
            <tbody>
              {([
                { p: "0.0", acc: "0.751", gap: "0.249" },
                { p: "0.1", acc: "0.754", gap: "0.246" },
                { p: "0.2", acc: "0.771", gap: "0.229" },
                { p: "0.3", acc: "0.773", gap: "0.227" },
                { p: "0.5", acc: "0.777", gap: "0.223" },
                { p: "0.7", acc: "0.773", gap: "0.227" },
              ] as const).map((r) => (
                <tr key={r.p}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.p}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.acc === "0.777" ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.acc}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.gap === "0.223" ? "var(--good)" : "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Train accuracy 1.000 at every rate.
        </p>

        <h2>Reading the curve</h2>
        <p>
          The shape is a shallow inverted U. From <M>{String.raw`p = 0`}</M> (0.751) the gains come quickly:
          by <M>{String.raw`p = 0.2`}</M> test accuracy is already 0.771, most of the total improvement. It
          keeps creeping up to the peak at <M>{String.raw`p = 0.5`}</M> (<strong>0.777</strong>), and then —
          this is the important part — it <em>falls back</em> at <M>{String.raw`p = 0.7`}</M> to 0.773.
        </p>
        <p>
          That downturn is not noise; it is the mechanism reaching its limit. At <M>{String.raw`p = 0.7`}</M>
          {" "}the network keeps, on average, only 30% of its units on each pass. You have regularised so
          hard that you have started removing capacity the network actually needs to fit the signal. The
          benefit of noise is now outweighed by the cost of a network too thin to represent the answer. Push
          <M>{String.raw`p`}</M> further toward 1 and test accuracy would collapse toward chance — you would
          be training an increasingly empty network.
        </p>

        <Callout color={CORAL} title={<>The dial has a best setting, and it is not the maximum</>}>
          A common beginner instinct is &ldquo;if a little regularisation helps, more must help more.&rdquo;
          The sweep refutes it directly: 0.5 beats 0.7. Every regulariser trades training fit for test
          transfer, and past the sweet spot you are paying training fit you needed. The job is to find the
          top of the U, not to crank the knob.
        </Callout>

        <h2>Where to apply it</h2>
        <p>
          Placement matters as much as rate. The standard practice:
        </p>
        <p>
          <strong>Hidden / fully-connected layers: yes.</strong> This is dropout&rsquo;s home. Dense layers
          have the most parameters and the most opportunity for co-adaptation, so they benefit most. The
          sweep above is dropout on the hidden layers of the MLP.
        </p>
        <p>
          <strong>Inputs: rarely, and only lightly.</strong> Dropping input features is a much blunter
          intervention — you are throwing away raw evidence, not redundant internal representations. It is
          occasionally used as a mild augmentation with a small rate (0.1 or so), but heavy input dropout
          usually just starves the model. When you want input-side noise, dedicated{" "}
          <Link href="/learn/nn-regularisation/data-augmentation" style={link}>augmentation</Link> is the
          better tool.
        </p>
        <p>
          <strong>With BatchNorm: reduce or drop it.</strong> Dropout and{" "}
          <Link href="/learn/nn-regularisation/batchnorm-as-reg" style={link}>BatchNorm</Link> interact
          badly. BatchNorm normalises using batch statistics that dropout&rsquo;s randomness disturbs, and
          the two can fight — the mismatch between the variance BatchNorm sees at train time (dropout on)
          and test time (dropout off) is a documented source of degradation. Many modern architectures use
          BatchNorm and little or no dropout for exactly this reason. The last chapter of this track measures
          the interaction directly.
        </p>

        <Callout color={CORAL} title={<>Practical defaults</>}>
          For hidden layers of a fully-connected network, start at <strong>0.2 to 0.5</strong> — 0.5 is the
          classic default from the original paper and the peak on this problem. Use the low end (0.1–0.2) for
          smaller networks or when you are already using other regularisers, and reserve the high end for
          large, heavily overfitting models. Do not put meaningful dropout on inputs, and turn it down when
          BatchNorm is present.
        </Callout>

        <Proof color={CORAL} title="why very high p under-fits — effective capacity scales as (1 − p) × width">
          <p>
            A layer of width <M>{String.raw`W`}</M> under dropout keeps each unit independently with
            probability <M>{String.raw`1-p`}</M>. The expected number of active units on any forward pass is
          </p>
          <MathBlock>{String.raw`\mathbb{E}[\text{active units}] = (1-p)\, W.`}</MathBlock>
          <p>
            So the network the optimiser actually trains on each step has, in expectation, an{" "}
            <strong>effective width</strong> of <M>{String.raw`(1-p)W`}</M>. At{" "}
            <M>{String.raw`p = 0.5`}</M> that is <M>{String.raw`W/2`}</M> — still ample for this problem, so
            the noise benefit dominates. At <M>{String.raw`p = 0.7`}</M> it is <M>{String.raw`0.3W`}</M>, and
            the thinned network is starting to lack the units it needs to represent the signal; the effective
            capacity has dropped below what the task requires. As <M>{String.raw`p \to 1`}</M> the effective
            width goes to zero and the network can represent nothing. This is why the rate curve is an
            inverted U rather than monotone: for small <M>{String.raw`p`}</M> you gain robustness with
            plenty of capacity to spare, but past a point you are trading away capacity the model genuinely
            needs, and the trade turns negative.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Test accuracy rises to 0.777 at <M>{String.raw`p = 0.5`}</M> then falls to 0.773 at{" "}
                <M>{String.raw`p = 0.7`}</M>. Why does the extra dropout hurt?</>,
              options: [
                "The network starts overfitting again at high p",
                "At p = 0.7 the effective width (1 − p)W is too small, removing capacity the network needs to fit the signal",
                "High dropout makes the gradients explode",
              ],
              answer: 1,
              explain: <>Effective capacity scales as <M>{String.raw`(1-p)W`}</M>. At 0.7 only 30% of units
                survive on average, and the thinned network begins to lack the capacity to represent the
                answer. The noise benefit is outweighed by the capacity cost — the top of the inverted U is
                behind you.</>,
            },
            {
              q: <>Where is heavy dropout usually a bad idea?</>,
              options: [
                "On hidden fully-connected layers",
                "On the input layer, because dropping raw features discards evidence rather than redundant internal representations",
                "On the last hidden layer only",
              ],
              answer: 1,
              explain: <>Input dropout throws away raw evidence and tends to starve the model. It is
                occasionally used very lightly as augmentation, but hidden layers are dropout&rsquo;s proper
                home. For input-side noise, dedicated data augmentation is the better tool.</>,
            },
            {
              q: <>You add BatchNorm to a network that already uses dropout 0.5. What is the standard advice?</>,
              options: [
                "Increase dropout to 0.7 to compensate",
                "Reduce or remove the dropout — BatchNorm regularises on its own and the two interact badly through the train/test variance mismatch",
                "Keep both at full strength; they never interfere",
              ],
              answer: 1,
              explain: <>BatchNorm relies on batch statistics that dropout&rsquo;s randomness disturbs, and
                the variance it sees differs between train (dropout on) and test (dropout off). Many modern
                architectures use BatchNorm with little or no dropout for this reason.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/why-dropout-works", label: <>← Why dropout works</> }}
          next={{ href: "/learn/nn-regularisation/dropout-at-test", label: <>Next up · Dropout at test time →</> }}
        />
      </div>
    </article>
  );
}
