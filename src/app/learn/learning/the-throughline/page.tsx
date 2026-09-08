import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { Backlinks } from "@/components/Backlinks";

export const metadata = {
  title: "The throughline — Manifold",
  description:
    "The whole Learning track in one arc: drop the model, sample the Bellman backup, and everything divides along two axes — how you estimate (MC vs TD) and whose policy you target (on vs off). Where reinforcement learning goes next.",
};

const GOLD = "var(--c-rl)";

export default function TheThroughline() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Synthesis", color: GOLD }]}
        time="about 7 minutes"
        title={<>The throughline</>}
        intro={<>You arrived able to solve a known world by dynamic programming. You leave able to <em>learn</em> one
          you were never handed — to act, sample, and bootstrap your way to an optimal policy from experience alone.
          Here is the whole track in a single view, and the doors it opens.</>}
      />

      <div className="lesson">
        <h2>The arc, in five moves</h2>
        <ol>
          <li>
            <strong>Drop the model.</strong> Planning summed the Bellman backup over a known <M>P</M> and <M>R</M>.
            Learning has neither, so it <em>samples</em> the backup from experience instead. Every method in the track
            is one answer to &ldquo;which samples do I average, and how?&rdquo;
          </li>
          <li>
            <strong>Two ways to estimate a value.</strong> <strong>Monte Carlo</strong> averages complete returns —
            unbiased, high-variance, offline. <strong>Temporal-difference</strong> learning bootstraps after one step
            — biased, low-variance, online, and the workhorse. They are the ends of the <em>n-step</em> dial, and the
            best setting is usually in between; eligibility traces (<M>{String.raw`\lambda`}</M>) average over all{" "}
            <M>n</M> at once, online.
          </li>
          <li>
            <strong>Control needs Q, and exploration.</strong> Without a model, greedy improvement needs action
            values <M>Q</M>, and an agent can only learn about actions it tries — so exploration (ε-greedy, GLIE)
            returns to centre stage.
          </li>
          <li>
            <strong>On-policy or off-policy.</strong> <strong>SARSA</strong> learns the value of the policy it
            follows; <strong>Q-learning</strong> learns the optimal policy while behaving otherwise. The cliff made
            the difference vivid; Expected SARSA lowered SARSA&rsquo;s variance; off-policy unlocked replay and
            learning from logs — at the cost of importance-sampling variance or the max&rsquo;s <em>maximization
            bias</em>, which Double Q-learning cures.
          </li>
          <li>
            <strong>The limits.</strong> Everything here kept a <em>table</em> — one value per state. Real problems
            have too many states to store or visit, so values must be <em>approximated</em> by a parametric function
            that generalises across states. That is the next track, and where the deadly triad and deep RL begin.
          </li>
        </ol>

        <Callout color={GOLD} title={<>The one sentence to keep</>}>
          When you cannot read the model, you cannot sum the Bellman backup — so you <strong>sample</strong> it; and
          then every algorithm is a choice on two axes: <strong>how you turn samples into a value</strong> (Monte
          Carlo vs temporal-difference, with n-step and <M>{String.raw`\lambda`}</M> between them) and{" "}
          <strong>whose policy you are valuing</strong> (on-policy vs off-policy). Master those two axes and the whole
          zoo — SARSA, Q-learning, Expected SARSA, Double Q, TD(λ) — is just their combinations.
        </Callout>

        <h2>The two axes, as a map</h2>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 460 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}></th><th style={th}>On-policy</th><th style={th}>Off-policy</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdc}><strong>Monte Carlo</strong></td><td style={tdc}>ε-soft MC control</td><td style={tdc}>importance-sampling MC</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdc}><strong>TD (1-step)</strong></td><td style={tdc}>SARSA, Expected SARSA</td><td style={tdc}>Q-learning, Double Q</td>
              </tr>
              <tr>
                <td style={tdc}><strong>TD (n-step / λ)</strong></td><td style={tdc}>n-step SARSA, SARSA(λ)</td><td style={tdc}>n-step / off-policy Q(λ)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>What this track assumed — and what comes next</h2>
        <p>
          Two assumptions remain to drop, and they define the rest of the family:
        </p>
        <ul>
          <li>
            <strong>Values fit in a table.</strong> Drop it and you must generalise across states with a parametric
            value function — <em>function approximation</em> and deep RL (DQN, and the deadly triad that makes
            stability hard).
          </li>
          <li>
            <strong>Act by being greedy on a value function.</strong> Drop it and you can optimise a{" "}
            <em>parameterised policy</em> directly — <em>policy-gradient</em> methods — and fuse the two into{" "}
            <strong>actor&ndash;critic</strong>, where the critic is exactly the value function you now know how to
            learn.
          </li>
        </ul>
        <p>
          Both keep everything you built here — sampled backups, TD errors, bootstrapping, the on/off-policy
          distinction, generalized policy iteration. The table becomes a network; the greedy step may become a
          gradient; the ideas endure.
        </p>

        <Quiz
          accent={GOLD}
          title="Throughline test"
          questions={[
            {
              q: <>What is the single move that turns planning into learning?</>,
              options: [
                "Switching from V to Q",
                "Replacing the exact sum of the Bellman backup over a known model with an average of sampled transitions",
                "Adding exploration",
              ],
              answer: 1,
              explain: <>No model means no sum over <M>P</M> and <M>R</M>. You sample the backup from experience
                instead — the foundation the entire track is built on.</>,
            },
            {
              q: <>Name the two axes that organise every method in this track.</>,
              options: [
                "Discrete vs continuous, and small vs large",
                "How you estimate a value (Monte Carlo ↔ TD, with n-step/λ between) and whose policy you target (on-policy vs off-policy)",
                "Model-based vs model-free, and tabular vs deep",
              ],
              answer: 1,
              explain: <>Estimation method and target policy. MC/TD/n-step/λ is one axis; on-policy vs off-policy the
                other. Every named algorithm is a point in that grid.</>,
            },
            {
              q: <>Why did the cliff experiment matter?</>,
              options: [
                "It showed Q-learning is always better than SARSA",
                "It made the on/off-policy difference concrete: Q-learning learns the optimal (risky) path but does worse online; SARSA learns a safe path and earns more while exploring",
                "It proved SARSA converges faster",
              ],
              answer: 1,
              explain: <>On-policy SARSA values the policy it actually runs (exploration included) and detours from the
                cliff; off-policy Q-learning targets the greedy optimum and walks the edge — better once exploration
                stops, worse while it continues.</>,
            },
            {
              q: <>What assumption does this whole track keep, that the next one drops?</>,
              options: [
                "That rewards are known",
                "That values fit in a table with one entry per state — dropped by function approximation, which generalises across states",
                "That the environment is Markov",
              ],
              answer: 1,
              explain: <>Every method stored a table. Real state spaces are far too large to store or visit, so values
                must be approximated by a parametric function — the start of deep RL.</>,
            },
          ]}
        />

        <h2>Where to go next</h2>
        <p>
          You now hold model-free prediction and control whole — the classical core of reinforcement learning. The
          natural next step is <strong>function approximation</strong>, which replaces the table with a learned
          function and opens the door to deep RL, followed by <strong>policy-gradient and actor&ndash;critic</strong>{" "}
          methods, which optimise the policy directly with the value function you built here as their critic. Each
          keeps the machinery of these three RL tracks and drops one more assumption.
        </p>

        <Backlinks
          label="Revisit"
          items={[
            { label: "The sampled backup", href: "/learn/learning/the-sampled-backup" },
            { label: "Temporal-difference learning", href: "/learn/learning/temporal-difference-learning" },
            { label: "SARSA vs Q-learning: the cliff", href: "/learn/learning/sarsa-vs-q-learning" },
            { label: "What learning still assumes", href: "/learn/learning/what-learning-still-assumes" },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/learning/what-learning-still-assumes", label: <>← What learning still assumes</> }}
          next={{ href: "/map", label: <>The curriculum map →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const tdc: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", verticalAlign: "top", lineHeight: 1.5 };
