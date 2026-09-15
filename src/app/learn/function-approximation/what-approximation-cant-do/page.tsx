import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { TriadDiagram } from "@/components/figures/fa/FaDiagrams";

export const metadata = {
  title: "What approximation still can't do — Manifold",
  description:
    "Hide the velocities from CartPole and the same DQN drops from 360 steps to 35.6 — no amount of capacity recovers information the state does not contain. Four walls: partial observability, continuous actions, sample cost (84,935 steps for one pole), and blind exploration.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatApproximationCantDo() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 11 minutes"
        title={<>What approximation still can&rsquo;t do</>}
        intro={<>Dropping the table bought a great deal: continuous states, generalisation, and a network that
          invents its own features. It did not buy everything, and the gaps are precise enough to name — each one
          is a door into another track.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Wall 1: it cannot see what the state does not contain</h2>
        <p>
          Every method in this track assumes the state is <strong>Markov</strong> — that{" "}
          <M>S_t</M> holds everything relevant about the past. Function approximation makes a value out of
          whatever it is handed; it cannot recover information that was never there.
        </p>
        <p>
          Here is that stated as an experiment rather than a principle. CartPole&rsquo;s state is four numbers:
          cart position, cart velocity, pole angle, pole angular velocity. Delete the two velocities and hand the
          identical DQN a two-number state — it still sees exactly where the pole is, just not how fast it is
          falling.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Same network, same replay, same target network, same 200 episodes — but the agent sees
            position and angle only. How far does it get?</>}
          options={["Almost as well — it can infer speed", "Somewhat worse", "Much worse but still learning", "It barely improves at all"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`   full state (x, x', theta, theta')    last 25   358.6   best  500
   position and angle only              last 25    35.6   best   78

   the second agent sees WHERE the pole is, never HOW FAST it is falling.`}</CodeOutput>

        <p>
          <strong>358.6 against 35.6</strong> — a tenth of the performance, and its best episode ever (78 steps)
          is worse than the full agent&rsquo;s <em>average</em>. The problem is not capacity: the network is
          identical. Two physically different situations — a pole at 5° falling fast and a pole at 5° swinging
          back — look like the same state, and no function of that state can give them different values.
        </p>
        <p>
          The standard fixes are all about restoring the missing information rather than improving the
          approximator: stack the last few observations (which is exactly why Atari DQN feeds four frames, not
          one), or give the network a recurrent memory. Both amount to admitting that the observation is not the
          state.
        </p>

        <h2>Wall 2: the argmax over actions</h2>
        <p>
          Every method here derives its policy by comparing action values:
        </p>
        <MathBlock>{String.raw`\pi(s) = \arg\max_{a \in \mathcal{A}} \hat q(s,a,\mathbf{w})`}</MathBlock>
        <p>
          That is a loop over <M>{String.raw`\mathcal{A}`}</M>, which is fine for CartPole&rsquo;s two actions or
          Mountain Car&rsquo;s three. Now make the action a steering angle, or a joint torque, or twelve joint
          torques. The set is infinite, the loop does not terminate, and DQN has no policy to output.
        </p>
        <p>
          Discretising is the obvious dodge and it scales terribly: ten bins per dimension across twelve joints is{" "}
          <M>{String.raw`10^{12}`}</M> actions to compare on every single step, and the discretisation throws away
          the smoothness that made the problem tractable in the first place.
        </p>
        <p>
          The real answer is to stop deriving the policy from values and <em>parameterise the policy directly</em>{" "}
          — which is the entire premise of the policy-gradient track, and the reason it exists as a separate
          family rather than a footnote here.
        </p>

        <h2>Wall 3: the sample bill</h2>
        <p>
          CartPole is close to the easiest control problem there is, and the DQN of chapter 5 needed{" "}
          <strong>7,649 environment steps</strong> to reach a 200-step average and <strong>84,935 steps</strong>{" "}
          over 300 episodes. At CartPole&rsquo;s 50 Hz that is <strong>28 minutes</strong> of continuous
          pole-balancing to learn a task a person picks up in a few tries.
        </p>
        <p>
          In a simulator, minutes are free. Outside one they are not, and this is the wall that stops most real
          applications: a robot cannot fall over 85,000 times, and the{" "}
          <Link href="/learn/lies-of-p-capstone" style={link}>capstone that learns from a real game</Link> has to
          clone a human precisely because it cannot afford the samples.
        </p>
        <p>
          The reason the bill is so large is that model-free RL learns <em>everything</em> from reward alone.
          Every step teaches one number about one state, and dynamics the agent could have learned from a single
          observation are rediscovered thousands of times. Learning a model and planning with it — Dyna, MCTS —
          is the direct attack on this, and it is its own track.
        </p>

        <Callout color={GOLD} title={<>Wall 4: exploration is still ε-greedy, and that is embarrassing</>}>
          Everything in this track explored by acting randomly some fraction of the time, or by starting
          optimistic. Both work here because the tasks are forgiving: Mountain Car&rsquo;s goal is reachable by
          persistent rocking, and CartPole&rsquo;s reward arrives on literally every step.
          <br /><br />
          Neither survives a problem where the reward is a hundred correct actions away. Random exploration
          reaches such a state with probability that shrinks exponentially in the number of steps required, and no
          value approximator helps: you cannot approximate a return you have never once observed. This is why
          games like Montezuma&rsquo;s Revenge resisted DQN entirely while Breakout fell — and the fixes
          (curiosity, counts, goal-conditioning, demonstrations) are a research area rather than a trick.
          <br /><br />
          It is also the honest reason the{" "}
          <Link href="/learn/warehouse-robot-capstone/exploration-schedule" style={link}>warehouse capstone</Link>{" "}
          could tune ε and be done: small worlds forgive dumb exploration.
        </Callout>

        <TriadDiagram
          caption={<>The fourth wall, and the one this track spent a chapter inside. The other three
            walls are about what a value function cannot represent or cannot afford; this one is
            about what it cannot be trusted to do even when the representation is exact and the
            budget is infinite. It is the wall that policy-gradient methods walk around rather than
            through, by not learning a value function to act from in the first place.</>}
        />

        <h2>What each wall opens onto</h2>
        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Wall</th><th style={th}>Measured here as</th><th style={th}>Where it is answered</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Non-Markov observations</td><td style={td}>360.0 → 35.6</td>
                <td style={td}>Frame stacking, recurrence</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Continuous actions</td><td style={td}>Structural: the argmax has no loop to run</td>
                <td style={td}>Policy gradients &amp; actor–critic</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Sample cost</td><td style={td}>84,935 steps for one pole</td>
                <td style={td}>Model-based RL &amp; search</td>
              </tr>
              <tr>
                <td style={td}>Blind exploration</td><td style={td}>Fine here; fatal on sparse rewards</td>
                <td style={td}>Its own research literature</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          None of these are failures of the material in this track. They are the boundary of what values plus a
          function approximator can do, and knowing exactly where that boundary is, is the point of having walked
          to it.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/reading-a-learning-curve", label: <>← Reading a learning curve that lies</> }}
          next={{ href: "/learn/function-approximation/the-throughline", label: <>Next · The throughline →</> }}
        />
      </div>
    </article>
  );
}

const code = `def dqn_partial(keep, episodes=200, seed=0):
    "Exactly the DQN of chapter 5, but the agent only sees the components in \`keep\`."
    d = len(keep)
    env = CartPole(seed)
    q = MLP(d, 64, 2, seed=seed, lr=1e-3); qt = MLP(d, 64, 2, seed=seed, lr=1e-3); qt.copy_from(q)
    rng = np.random.default_rng(seed + 1)
    cap, batch, gamma, sync = 20000, 32, 0.99, 200
    S = np.zeros((cap, d)); A = np.zeros(cap, int); R = np.zeros(cap)
    S2 = np.zeros((cap, d)); D = np.zeros(cap)
    n = total = 0; lengths = []
    for ep in range(episodes):
        env.seed(seed * 1000 + ep); s = env.reset()[keep]
        for t in range(500):
            eps = max(0.05, 1.0 - total / 5000.0)
            a = int(rng.integers(2)) if rng.random() < eps else int(np.argmax(q.forward(s[None])[0]))
            s2_full, r, done = env.step(a); s2 = s2_full[keep]
            i = n % cap
            S[i], A[i], R[i], S2[i], D[i] = s, a, r, s2, float(done)
            n += 1; total += 1; s = s2
            if n >= batch:
                idx = rng.integers(0, min(n, cap), batch)
                bs, ba, br, bs2, bd = S[idx], A[idx], R[idx], S2[idx], D[idx]
                y = br + gamma * (1 - bd) * qt.forward(bs2).max(axis=1)
                out = q.forward(bs)
                dY = np.zeros_like(out)
                dY[np.arange(batch), ba] = (out[np.arange(batch), ba] - y) * (2.0 / batch)
                q.backward(dY)
                if total % sync == 0: qt.copy_from(q)
            if done: break
        lengths.append(t + 1)
    return np.array(lengths)

for keep, label in (([0, 1, 2, 3], "full state (x, x', theta, theta')"),
                    ([0, 2], "position and angle only")):
    L = dqn_partial(keep)
    print(f"   {label:36s} last 25 {L[-25:].mean():7.1f}   best {L.max():4d}")
print("\\n   the second agent sees WHERE the pole is, never HOW FAST it is falling.")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5 };
