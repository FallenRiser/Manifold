import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Saturation — Manifold",
  description:
    "One word covers most of what goes wrong with activations. Here it is defined precisely, measured for the whole zoo, and connected to the chain-rule product that makes it fatal.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Section 1 of scripts/activation_cases.py, measured on x in [-8, 8].
const ROWS: { act: string; range: string; peak: string; off: string; centred: boolean }[] = [
  { act: "sigmoid", range: "0.00 … 1.00", peak: "0.250", off: "42.7%", centred: false },
  { act: "tanh", range: "−1.00 … 1.00", peak: "1.000", off: "62.6%", centred: true },
  { act: "ReLU", range: "0.00 … ∞", peak: "1.000", off: "50.0%", centred: false },
  { act: "Leaky ReLU", range: "−∞ … ∞", peak: "1.000", off: "0.0%", centred: true },
  { act: "ELU", range: "−1.00 … ∞", peak: "1.000", off: "21.2%", centred: true },
  { act: "SELU", range: "−1.76 … ∞", peak: "1.758", off: "17.7%", centred: true },
  { act: "GELU", range: "−0.17 … ∞", peak: "1.129", off: "31.2%", centred: true },
  { act: "Swish", range: "−0.28 … ∞", peak: "1.100", off: "11.4%", centred: true },
  { act: "Mish", range: "−0.31 … ∞", peak: "1.088", off: "11.3%", centred: true },
  { act: "softplus", range: "0.00 … ∞", peak: "1.000", off: "21.3%", centred: false },
];

const th: React.CSSProperties = {
  textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500,
  borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)",
  fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
};

export default function SaturationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "What an activation is for", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>Saturation</>}
        intro={<>If you learn one word from this track, learn this one. Saturation is what almost every activation
          failure reduces to, and once it is defined precisely rather than gestured at, most of the zoo becomes
          predictable from a single column of numbers.</>}
      />

      <div className="lesson">
        <h2>A precise definition</h2>
        <p>
          An activation is <strong>saturated</strong> at an input when its derivative there is close enough to zero
          that the unit is effectively no longer connected to the loss. Not &ldquo;flat-looking&rdquo; — the
          criterion is about <M>{String.raw`f'`}</M>, and it has to be, because that is the factor backpropagation
          multiplies by.
        </p>
        <p>
          Throughout this track the threshold is <M>{String.raw`|f'| < 0.01`}</M>. It is a choice, not a law, and the
          justification is the chain rule: a single factor of 0.01 costs you two orders of magnitude, and a network
          with three such layers in a row has divided its gradient by a million.
        </p>

        <MathBlock>{String.raw`\underbrace{f'(z_1)}_{0.01}\cdot\underbrace{f'(z_2)}_{0.01}\cdot\underbrace{f'(z_3)}_{0.01} \;=\; 10^{-6}`}</MathBlock>

        <h2>The anatomy table</h2>
        <p>
          Every activation on this track, measured the same way over{" "}
          <M>{String.raw`x \in [-8, 8]`}</M>: the output range, the largest slope it ever produces, and the
          percentage of that interval on which it is saturated.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 480 }}>
            <thead>
              <tr>
                <th style={th}>activation</th>
                <th style={th}>output range</th>
                <th style={th}>peak slope</th>
                <th style={th}>saturated</th>
                <th style={th}>zero-centred</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.act}>
                  <td style={{ ...td, color: "var(--ink)", fontWeight: 500 }}>{r.act}</td>
                  <td style={td}>{r.range}</td>
                  <td style={{ ...td, color: Number(r.peak) < 0.5 ? "var(--bad)" : "var(--ink)" }}>{r.peak}</td>
                  <td style={{ ...td, color: parseFloat(r.off) > 40 ? "var(--bad)" : parseFloat(r.off) < 15 ? "var(--good)" : "var(--ink)" }}>{r.off}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{r.centred ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Ranges are measured on the same interval, so the
          &ldquo;∞&rdquo; entries read 8.00 there; they are unbounded above in truth.
        </p>

        <h2>Reading the table honestly</h2>
        <p>
          The obvious ranking — least saturated wins — is wrong, and the table itself tells you so.{" "}
          <strong>tanh saturates on 62.6% of the interval, more than any other function here, including
          sigmoid.</strong> And tanh is a perfectly serviceable activation that beat sigmoid decisively for a decade
          and still wins on this track&rsquo;s bakeoff. The percentage on its own does not decide anything.
        </p>

        <Callout color={CORAL} title={<>Two columns, read together</>}>
          What separates tanh from sigmoid is not the width of the saturated region but the{" "}
          <strong>peak slope</strong>: 1.000 against 0.250. A tanh unit sitting in its live region multiplies the
          gradient by something near 1 and loses nothing; a sigmoid unit in its live region loses a factor of four
          even at its very best.
          <br /><br />
          So the column that predicts trouble is not &ldquo;how often is it dead&rdquo; but{" "}
          <strong>&ldquo;how much does it cost when it is alive&rdquo;</strong>. Sigmoid is the only function in the
          table whose peak slope is below 1, and it is the only function that will fail outright in the bakeoff.
        </Callout>

        <h2>Saturated is not the same as dead</h2>
        <p>
          The distinction matters for what you do about it. A tanh unit sitting far out in its tail is saturated{" "}
          <em>now</em>; a small change in its incoming weights brings it back toward zero, and the gradient it needs
          for that change is small but not zero. It can recover.
        </p>
        <p>
          A ReLU unit whose input is negative for every training example has a derivative of{" "}
          <strong>exactly zero</strong> — not small, zero. No update of any size reaches it, so nothing can move it
          back. That is a permanent state, and it gets{" "}
          <Link href="/learn/activation-functions/dying-relu" style={link}>its own page</Link> because the remedy is
          different: you cannot fix it by adjusting the learning rate, only by restarting or by choosing a function
          whose slope is never exactly zero.
        </p>

        <Proof color={CORAL} title="why the threshold is a convenience, not a cliff">
          <p>
            Nothing special happens at <M>{String.raw`|f'| = 0.01`}</M>. The real quantity is the product down the
            whole network, and what matters is its magnitude relative to your step size and your floating-point
            precision.
          </p>
          <p>
            In float32, values below roughly <M>{String.raw`10^{-38}`}</M> underflow to zero outright — a gradient
            that has passed through twenty layers at 0.01 each is already at{" "}
            <M>{String.raw`10^{-40}`}</M> and is literally, not figuratively, zero. Long before that, it is small
            enough that <M>{String.raw`\eta \nabla`}</M> is below the resolution of the parameters it is meant to
            change: adding <M>{String.raw`10^{-12}`}</M> to a weight of order 1 in float32 leaves the weight bitwise
            unchanged.
          </p>
          <p>
            So &ldquo;saturated&rdquo; is a spectrum whose end is genuine, hardware-level zero. The 1% threshold is
            chosen because it makes the comparison in the table meaningful, and because a factor that small is
            already fatal at any realistic depth.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>tanh is saturated on 62.6% of [−8, 8] and sigmoid on 42.7%. Why is tanh nonetheless the better
                hidden-layer choice of the two?</>,
              options: [
                "The measurement is misleading — tanh is not really saturated there",
                "Because tanh's peak slope is 1.0 against sigmoid's 0.25, so a live tanh unit costs nothing while a live sigmoid unit still divides by four",
                "Because tanh is cheaper to compute",
              ],
              answer: 1,
              explain: <>The width of the dead region and the cost of the live region are separate properties, and
                the second is what compounds with depth. A factor of 1 repeated twelve times is 1; a factor of 0.25
                repeated twelve times is <M>{String.raw`6\times10^{-8}`}</M>.</>,
            },
            {
              q: <>What is the difference between a saturated tanh unit and a dead ReLU unit?</>,
              options: [
                "None — both have stopped learning",
                "The tanh unit's gradient is small but non-zero so it can recover; the ReLU unit's is exactly zero, which is permanent",
                "The ReLU unit recovers faster because its slope is 1 when active",
              ],
              answer: 1,
              explain: <>Exactly zero is a different situation from very small. Multiplying a small number by a large
                learning rate still moves something; multiplying zero by anything does not. This is why the two
                failures have different remedies.</>,
            },
            {
              q: <>Which single column of the anatomy table best predicts which activation fails outright in a deep
                network?</>,
              options: ["The saturated percentage", "The peak slope", "Whether it is zero-centred"],
              answer: 1,
              explain: <>Sigmoid is the only entry with a peak slope below 1, and it is the only entry that fails to
                train at depth in the measured bakeoff. The saturated percentage would have wrongly condemned tanh,
                which has the highest value in that column.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/the-derivative-is-the-point", label: <>← The derivative is the point</> }}
          next={{ href: "/learn/activation-functions/where-your-units-sit", label: <>Next up · The step, and why it could not be trained →</> }}
        />
      </div>
    </article>
  );
}
