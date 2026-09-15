import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { ReplayScatter } from "@/components/figures/fa/CostToGo";
import { REPLAY as REPLAY_DATA } from "@/components/figures/fa/data";

export const metadata = {
  title: "Experience replay — Manifold",
  description:
    "Learning from the stream as it arrives gives 22.6 steps on CartPole; sampling the same transitions from a buffer gives 360.4. The single largest effect in this chapter — and the fix quietly makes your algorithm off-policy, adding a leg of the deadly triad rather than removing one.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ExperienceReplay() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 10 minutes"
        title={<>Experience replay</>}
        intro={<>An agent&rsquo;s experience arrives as a stream: this state, then the one next to it, then the one
          next to that. Every supervised-learning instinct you have assumes the opposite. Fixing that mismatch
          turns out to be the single largest effect in this chapter.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Two problems with learning as you go</h2>
        <p>
          <strong>The samples are correlated.</strong> Consecutive CartPole states differ by 20 milliseconds of
          physics. A batch of the last 32 transitions is 32 near-copies of one situation, so the gradient it
          produces is one situation&rsquo;s opinion, repeated — and stochastic gradient descent assumes
          independent samples for good reason.
        </p>
        <p>
          <strong>And the batches keep changing subject.</strong> While the pole is falling left, every update
          says &ldquo;push left&rdquo;. Then the agent improves, the distribution moves, and the next thousand
          updates are about a different region entirely. You met this in{" "}
          <Link href="/learn/function-approximation/what-generalisation-costs" style={link}>chapter 3</Link>: with
          global features, learning about one region <em>overwrites</em> what you knew about the others. A network
          is the most global representation there is.
        </p>
        <p>
          <strong>Experience replay</strong> fixes both with one idea. Store every transition{" "}
          <M>(s, a, r, s')</M> in a buffer of the last 20,000. To learn, sample 32 of them uniformly at random.
          Neighbouring-in-time transitions land in different batches; each batch mixes situations from across
          training; and every transition gets used many times instead of once.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Identical network, identical seed, identical 150 episodes. One learns from 32 random past
            transitions, the other from the 32 most recent ones. How different can the outcome be?</>}
          options={["Barely different", "Replay maybe 20-30% better", "Replay a few times better", "Without replay it barely learns at all"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`same DQN, same seed, same 150 episodes -- only the batch differs

replay: 32 random past transitions     last 25 episodes   385.3 steps   best  500
no replay: the last 32 steps, in order last 25 episodes    27.2 steps   best  156`}</CodeOutput>

        <p>
          <strong>385.3 against 27.2.</strong> Not a tuning difference — the version without replay never learns
          to balance at all, and its best episode ever (156 steps) is worse than the other&rsquo;s routine
          performance. One line of code chooses which of those two agents you get.
        </p>
        <Callout color={GOLD} title={<>Why your number will not be exactly 385.3</>}>
          Every other runnable cell in this track prints the same digits here as it does on our machine. The DQN
          cells do not, and the reason is worth knowing. Running this same code and seed under CPython instead of
          the browser&rsquo;s Python gives <strong>364.0</strong> rather than 385.3 — and the first fifty episodes
          are <em>identical</em> before they part.
          <br /><br />
          Nothing is broken. Floating-point arithmetic differs in the last bit between the two numpy builds;
          eventually that flips one <M>{String.raw`\arg\max`}</M>, which changes one action, which changes every
          state that follows. Reinforcement learning amplifies rounding error into different histories. The
          no-replay figure of 27.2 matches exactly, because an agent that never learns has no divergence to
          amplify.
          <br /><br />
          So treat the single run below as an illustration, and the five-seed table as the claim. This is the
          same discipline the rest of the track applies — it is just unusually visible here.
        </Callout>

        <p>
          The claim, then (<code>scripts/fa_cases.py ch5</code>), which after chapter 3 is a check we run before
          believing anything:
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>300 episodes, 5 seeds</th><th style={thR}>last-50 mean</th><th style={thR}>per-seed</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>With replay</td><td style={{ ...tdR, fontWeight: 600 }}>360.4 ± 55.6</td>
                <td style={tdR}>339 / 362 / 456 / 317 / 329</td>
              </tr>
              <tr>
                <td style={td}>No replay</td><td style={{ ...tdR, color: "var(--bad)" }}>22.6 ± 18.1</td>
                <td style={tdR}>17 / 10 / 54 / 18 / 14</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          A <strong>16× gap</strong>, with no overlap between the two sets of seeds. This is the clearest effect
          measured anywhere in this track, and it is worth contrasting with the width dial in chapter 3, where the
          difference between settings was a few percent and one bad seed. Some knobs matter more than others, and
          the only way to know which is to measure both.
        </p>

        <Callout color={GOLD} title={<>Replay does not remove a leg of the triad — it adds one</>}>
          It is tempting to file replay under &ldquo;stability fix&rdquo; and move on. Look closer at what a
          buffer contains: transitions generated by the policy you had 5,000 steps ago, which is not the policy
          you are evaluating now. <strong>Sampling from a replay buffer is off-policy learning by
          construction.</strong>
          <br /><br />
          So DQN deliberately takes on the leg that{" "}
          <Link href="/learn/function-approximation/bairds-counterexample" style={link}>Baird&rsquo;s
          counterexample</Link> showed is the dangerous one — it just gets more from breaking correlation than it
          loses from going off-policy. That trade is the reason the next page exists: having chosen to be
          off-policy and bootstrapped and nonlinear, DQN needs something to hold the remaining instability down.
        </Callout>

        <ReplayScatter
          consecutive={REPLAY_DATA.consecutive}
          sampled={REPLAY_DATA.sampled}
          caption={<>120 transitions taken consecutively, and 120 drawn at random from a buffer of
            the same run. The left panel is a trajectory: each point is a small step from the last,
            so a minibatch of 32 of them carries far less information than 32 independent examples —
            measured here, the within-batch spread is <strong>0.0527</strong> against{" "}
            <strong>0.0810</strong> for the sampled batch, so the buffer buys about{" "}
            <strong>1.5&times;</strong> the diversity. That multiplier is more modest than the usual
            telling suggests, and the shape of the two panels is the better argument: gradient
            descent assumes its batches are samples of a distribution, and the left-hand panel is
            not one.</>}
        />

        <h2>The knobs, and what they trade</h2>
        <ul>
          <li>
            <strong>Buffer size.</strong> Too small and batches are still correlated; too large and you spend
            training on transitions from a policy so old they are irrelevant. 20,000 here for a task whose
            episodes are at most 500 steps.
          </li>
          <li>
            <strong>Batch size.</strong> More samples per update means a less noisy gradient and more compute per
            environment step. 32 is the usual starting point and is what these runs use.
          </li>
          <li>
            <strong>Replay ratio.</strong> How many gradient steps per environment step — one here. Raising it
            makes each transition go further, which matters when data is expensive.
          </li>
          <li>
            <strong>Uniform or prioritised.</strong> Sampling in proportion to TD error focuses effort on
            surprising transitions, at the price of a bias that has to be corrected with importance weights.
            Worth knowing about; not needed for CartPole.
          </li>
        </ul>

        <PrevNext
          prev={{ href: "/learn/function-approximation/from-linear-to-a-network", label: <>← From linear to a neural network</> }}
          next={{ href: "/learn/function-approximation/target-networks", label: <>Next · Target networks →</> }}
        />
      </div>
    </article>
  );
}

const code = `print("same DQN, same seed, same 150 episodes -- only the batch differs\\n")
for replay, label in ((True, "replay: 32 random past transitions"),
                      (False, "no replay: the last 32 steps, in order")):
    q, L = train_cartpole_dqn(episodes=150, replay=replay, seed=0)
    print(f"{label:38s} last 25 episodes {L[-25:].mean():7.1f} steps   best {L.max():4d}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
