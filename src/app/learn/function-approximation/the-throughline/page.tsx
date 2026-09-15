import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Curve } from "@/components/figures/fa/Curve";
import { BAIRD_X, BAIRD_SERIES } from "@/components/figures/fa/data";

export const metadata = {
  title: "The throughline — Manifold",
  description:
    "One equation replaced the table, and everything else in this track followed from it: generalisation, the resolution and width dials, a biased destination, the deadly triad, and the engineering that makes deep RL work anyway.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheThroughline() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Synthesis", color: GOLD }]}
        time="about 9 minutes"
        title={<>The throughline</>}
        intro={<>Twenty-three pages ago the only change was that a table would not fit. Everything since —
          generalisation, the dials, the biased destination, the divergence, and the two engineering tricks that
          made deep RL work — followed from that one substitution.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The whole track in one line</h2>
        <MathBlock>{String.raw`V(s) \;\longrightarrow\; \hat v(s, \mathbf{w})`}</MathBlock>
        <p>
          A lookup became a function with parameters. That is the entire idea, and its consequences arrived in a
          strict order:
        </p>
        <ul>
          <li>
            <strong>Parameters are shared, so learning spreads.</strong> One update moved 100 states at once —
            generalisation, which is what makes big spaces learnable and is not optional but structural.
          </li>
          <li>
            <strong>Sharing means you cannot be right everywhere</strong>, so &ldquo;best&rdquo; needs a
            definition. Value error, weighted by the states the policy actually visits — the centre of the walk
            is visited 135.8× more than its edge, and the best fit ignores the edge accordingly.
          </li>
          <li>
            <strong>The best fit is a floor you may not reach.</strong> Polynomial features had a floor of 0.0010
            and reached only 0.0244; Fourier had an eight times worse floor and got closer to it, because
            conditioning decides what gradient descent can actually find.
          </li>
          <li>
            <strong>Bootstrapping changes the destination.</strong> TD converges — to the TD fixed point, 0.1167
            against the value-error optimum&rsquo;s 0.0544, and reliably so: sampled TD landed within 0.029 of
            where the equations said it would.
          </li>
          <li>
            <strong>And then the guarantees run out.</strong> Off-policy, bootstrapped, approximated: the weights
            grow 68.6× on a problem with no rewards and a perfect representation available.
          </li>
        </ul>

        <h2>Four dials, and what measuring them taught</h2>
        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Dial</th><th style={th}>What it trades</th><th style={th}>Measured</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}><strong>Resolution</strong> — how fine the features are</td>
                <td style={td}>Approximation error against estimation error</td>
                <td style={td}>A clean U: 20 groups best at 0.0467, the 1000-cell table <em>worst</em> at 0.3592</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}><strong>Width</strong> — how far one update reaches</td>
                <td style={td}>Early speed against final quality and reliability</td>
                <td style={td}>Wide tiles 3× faster early (237.7 vs 710.0); coarse ones fail a seed</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}><strong>Step size</strong></td>
                <td style={td}>Speed against jitter — and it interacts with everything</td>
                <td style={td}>The best α flips with tile width; one fixed α made tile coding look worse</td>
              </tr>
              <tr>
                <td style={td}><strong>Bootstrapping</strong></td>
                <td style={td}>A cheaper journey for a biased destination</td>
                <td style={td}>2.1× worse value error than Monte Carlo&rsquo;s target — and the price of admission to the triad</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Curve
          x={BAIRD_X}
          series={BAIRD_SERIES}
          logY
          logX
          xlabel="update"
          ylabel="‖w‖"
          caption={<>The figure worth leaving the track with. Two runs on the same seven-state
            problem, the same data, the same features, the same step size; the only difference is
            whether the updates are weighted for a policy that did not generate them. One settles at
            9.00. The other is at 709 after a thousand steps and still climbing. Everything this
            track taught about features and resolution and capacity is downstream of the fact that
            the algorithm itself can fail, on a problem this small, for a reason that has nothing to
            do with any of them.</>}
        />

        <h2>The two hard truths</h2>
        <p>
          <strong>The deadly triad is a design constraint, not a bug.</strong> Function approximation,
          bootstrapping and off-policy learning are each individually worth having, and any two are safe. All
          three together can diverge, and removing any one of them fixed Baird&rsquo;s counterexample every time.
          Deep RL takes all three deliberately — a replay buffer <em>is</em> off-policy data — and then braces the
          structure with engineering: a frozen target to break the self-reference, and a buffer to break the
          correlation. On Baird a target network turned 10<sup>12</sup> into 10<sup>−13</sup>; on CartPole,
          removing replay cost 16× the performance.
        </p>
        <p>
          <strong>Measurement is the hard part, not the algorithms.</strong> Nearly every interesting claim in
          this track survived only because it was checked across seeds, horizons and step sizes — and one did
          not survive: the single-seed claim that 8×8 tiles beat 16×16 turned out to be noise. The training curve
          and the shipped agent can move in opposite directions in the same run (394.6 → 269.3 while the curve
          rose). A near-zero Bellman error can hide a value that is wrong by 1.95. A prediction of 107.96 on a
          task that pays at most 99.3 is a broken instrument that still balances the pole.
        </p>

        <Callout color={GOLD} title={<>What is deep about deep RL</>}>
          Less than the name suggests. The DQN in chapter 5 has <strong>450 parameters</strong> — fewer than the
          1,536 weights the tile-coded Mountain Car agent used, and it is a single hidden layer of 64 units. The
          network contributed the ability to invent features (0.0259 against aggregation&rsquo;s 0.0632, with
          nobody choosing a group boundary) and it took away every convergence guarantee, all of which required
          linearity.
          <br /><br />
          What made deep RL work was not depth. It was replay, target networks, and enough compute to survive the
          sample bill — plus, in the original Atari work, four stacked frames to keep the state Markov. The ideas
          in this chapter are engineering answers to the failures in chapter 4, and they are why an algorithm with
          no theory to stand on nevertheless stands.
        </Callout>

        <h2>Where the family goes next</h2>
        <p>
          Three doors, each opened by a specific limit measured on the last page:
        </p>
        <ul>
          <li>
            <strong>Policy gradients &amp; actor–critic</strong> — because{" "}
            <M>{String.raw`\arg\max_a \hat q`}</M> has no loop to run when actions are continuous. Parameterise
            the policy itself and the argmax disappears.
          </li>
          <li>
            <strong>Model-based RL &amp; search</strong> — because 84,935 environment steps for one pole is a
            price you cannot pay outside a simulator. Learn the dynamics, then plan against them.
          </li>
          <li>
            <strong>Policy search without gradients</strong> — because sometimes the gradient is unavailable or
            useless, and a population of policies competing directly is a genuinely different way to search.
          </li>
        </ul>
        <p>
          There is also the door back to practice: the{" "}
          <Link href="/learn/warehouse-robot-capstone" style={link}>warehouse capstone</Link> solved a real task
          with the tabular methods that came before this track, and its Playbook rules — tune each contender,
          evaluate what you ship, report the spread — are the same rules this track had to relearn the hard way,
          one measurement at a time.
        </p>

        <p style={{ marginTop: "1.6rem", paddingTop: "1.2rem", borderTop: "1px solid var(--border)" }}>
          The Learning track dropped the model and kept a number per state. This one dropped the number per state
          and kept a function. What survives both is the same loop that started the family: look at what happened,
          compare it with what you expected, and move your estimate a little way toward the difference.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/what-approximation-cant-do", label: <>← What approximation still can&rsquo;t do</> }}
          next={{ href: "/learn/building-environments", label: <>Next track · Building environments from scratch →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5 };
