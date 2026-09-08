import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";

export const metadata = {
  title: "What learning still assumes — Manifold",
  description:
    "This track dropped the known model but kept one hidden assumption: a table with one entry per state. On real problems the table can't be stored, let alone filled. Why generalisation across states — function approximation — is the next necessity, and the deadly triad that lurks there.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatLearningStillAssumes() {
  const code = `# Every method in this track stored one value per state (or state-action). How big is
# that table when the state is described by several variables, each discretised into bins?
for d in (2, 4, 8, 16, 32):
    bins = 10
    entries = bins ** d
    print(f"{d:>2} state variables x 10 bins each:  10^{d:<2} = {entries:.0e} table entries")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 7 minutes"
        title={<>What learning still assumes</>}
        intro={<>We made a great deal of dropping the model. But look back and one assumption survived every page
          untouched: that we could keep a <em>table</em> with one entry per state, visit every entry, and fill it in.
          On a 4&times;4 grid that is obvious. On almost any real problem it is impossible — and lifting it is the
          whole next track.</>}
      />

      <div className="lesson">
        <h2>The assumption hiding in plain sight</h2>
        <p>
          Monte Carlo, TD, SARSA, Q-learning, traces — every one stored values in an array indexed by state (or
          state&ndash;action). That <strong>tabular</strong> representation quietly assumed two things: that the table{" "}
          <em>fits in memory</em>, and that you can <em>visit every entry often enough</em> to estimate it. Both fail,
          fast, the moment the state is anything richer than a handful of grid cells.
        </p>

        <CodeBlock fromScratch={code} />
        <CodeOutput>{` 2 state variables x 10 bins each:  10^2  = 1e+02 table entries
 4 state variables x 10 bins each:  10^4  = 1e+04 table entries
 8 state variables x 10 bins each:  10^8  = 1e+08 table entries
16 state variables x 10 bins each:  10^16 = 1e+16 table entries
32 state variables x 10 bins each:  10^32 = 1e+32 table entries`}</CodeOutput>
        <p>
          Just 16 coarsely-binned variables already need <M>{String.raw`10^{16}`}</M> entries — more than you could
          store, and vastly more than you could ever visit. And real problems dwarf this: backgammon has around{" "}
          <M>{String.raw`10^{20}`}</M> states, Go about <M>{String.raw`10^{170}`}</M>, and an Atari screen — raw
          pixels — more configurations than there are atoms in the universe. A table has one more fatal flaw beyond
          size: it treats every state as <em>unrelated</em>. Learning about one state teaches it <em>nothing</em>{" "}
          about a nearly identical neighbour, because they are just different array slots. On a huge state space, where
          you will visit almost no state twice, that is hopeless.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="If you can never store or revisit most states, what must a value function do instead of looking up a table?"
          options={[
            "Visit states faster",
            "Generalise: represent V or Q as a parametric FUNCTION of state features, so that learning about one state updates its similar neighbours too",
            "Switch back to a known model",
          ]}
          nudge="Locked in. Replace the table with a function V(s; w) — a linear model, or a neural network. That's function approximation, the next track."
        />

        <h2>The fix, and the next track</h2>
        <p>
          The escape is to stop storing values and start <em>predicting</em> them: represent the value as a
          parametric function of state features, <M>{String.raw`\hat V(s; \mathbf{w}) \approx V^\pi(s)`}</M>, and
          learn the parameters <M>{String.raw`\mathbf{w}`}</M> instead of a table. A linear function over features, or
          a neural network over raw input, means an update at one state <em>generalises</em> to all similar states —
          the only way to cope when you will never see most states even once. Every idea from this track carries over
          intact: the same TD errors, the same SARSA and Q-learning targets, the same bootstrapping. What changes is
          that the update becomes a <em>gradient</em> step on <M>{String.raw`\mathbf{w}`}</M> rather than a write to a
          cell. This is <strong>function approximation</strong>, and it is where deep reinforcement learning begins.
        </p>

        <Callout color={GOLD} title={<>A warning that comes with the power: the deadly triad</>}>
          The tabular convergence guarantees you saw — TD to <M>{String.raw`V^\pi`}</M>, Q-learning to{" "}
          <M>{String.raw`Q^*`}</M> — lean on the table. Combine three ingredients and they can break: <strong>function
          approximation</strong> (generalising values), <strong>bootstrapping</strong> (TD targets built on your own
          estimates), and <strong>off-policy</strong> learning (training on data from another policy). Any two are
          fine; all three together — the <em>deadly triad</em> — can make value estimates <em>diverge</em>. Much of
          modern deep RL (target networks, experience replay, gradient-TD methods) is machinery for taming exactly
          this. You will meet it head-on in the next track; for now, simply know that leaving the table behind trades
          a storage wall for a stability challenge.
        </Callout>

        <h2>And beyond value functions</h2>
        <p>
          There is a second assumption this whole family of methods has quietly made: that the way to act is to learn
          a value function and then be greedy with respect to it. But you can also <em>parameterise the policy
          directly</em> and improve it by gradient ascent on expected reward — <strong>policy-gradient methods</strong>.
          The two ideas combine into <strong>actor&ndash;critic</strong> algorithms: a &ldquo;critic&rdquo; that
          learns a value function exactly as you did here, and an &ldquo;actor&rdquo; — a parameterised policy — that
          the critic guides. The value estimate you now know how to learn is precisely the critic. That synthesis is a
          later track; this one built its foundation.
        </p>

        <PrevNext
          prev={{ href: "/learn/learning/eligibility-traces", label: <>← Eligibility traces</> }}
          next={{ href: "/learn/learning/the-throughline", label: <>Next · The throughline →</> }}
        />
      </div>
    </article>
  );
}
